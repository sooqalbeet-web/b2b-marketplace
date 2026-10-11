import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, requireFactory, requireRole, errorResponse } from "@/lib/guards";

// CONFIRMED -> IN_PRODUCTION: creates the ProductionOrder (no stock is deducted).
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("FACTORY");
    const factory = await requireFactory(session.user.id);
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id } });
      if (!order || order.factoryId !== factory.id) throw new HttpError(404, "Order not found.");
      if (order.status !== "CONFIRMED") {
        throw new HttpError(400, "Only confirmed orders can start production.");
      }

      const production = await tx.productionOrder.create({
        data: {
          productionNumber: `PROD-${Date.now()}-${order.id.slice(-4)}`,
          orderId: order.id,
          factoryId: factory.id,
          productId: order.productId,
          plannedQuantity: order.quantity,
        },
      });

      await tx.order.update({ where: { id: order.id }, data: { status: "IN_PRODUCTION" } });
      return production;
    });

    return NextResponse.json({ production: result }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
