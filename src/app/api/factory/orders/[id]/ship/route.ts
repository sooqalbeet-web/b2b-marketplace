import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, requireFactory, requireRole, errorResponse } from "@/lib/guards";

// READY_TO_SHIP -> SHIPPED: deducts finished goods (STOCK_OUT) and creates the shipment.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("FACTORY");
    const factory = await requireFactory(session.user.id);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id } });
      if (!order || order.factoryId !== factory.id) throw new HttpError(404, "Order not found.");
      if (order.status !== "READY_TO_SHIP") {
        throw new HttpError(400, "Only orders that are ready to ship can be shipped.");
      }

      if (order.productId) {
        // Atomic guarded decrement: fails if stock is insufficient, even under concurrency.
        const deducted = await tx.inventory.updateMany({
          where: { productId: order.productId, currentQuantity: { gte: order.quantity } },
          data: { currentQuantity: { decrement: order.quantity } },
        });
        if (deducted.count === 0) {
          throw new HttpError(400, "Insufficient finished-goods stock to ship this order.");
        }

        await tx.inventoryTransaction.create({
          data: {
            factoryId: order.factoryId,
            productId: order.productId,
            type: "STOCK_OUT",
            quantity: order.quantity,
            reference: order.number,
            note: `Shipped ${order.quantity} units for ${order.number}.`,
          },
        });
      }

      const shipment = await tx.shipment.create({
        data: {
          orderId: order.id,
          carrier: body.carrier ?? null,
          trackingNumber: body.trackingNumber ?? null,
          note: body.note ?? null,
        },
      });

      const updated = await tx.order.update({ where: { id }, data: { status: "SHIPPED" } });
      return { order: updated, shipment };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
