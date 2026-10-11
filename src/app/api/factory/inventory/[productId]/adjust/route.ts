import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, requireFactory, requireRole, errorResponse } from "@/lib/guards";

// Manual correction (stock count, damage, opening balance). Always logged with a reason.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await requireRole("FACTORY");
    const factory = await requireFactory(session.user.id);
    const { productId } = await params;
    const b = await request.json();

    const delta = Number(b.delta);
    const note = String(b.note ?? "").trim();
    if (!Number.isInteger(delta) || delta === 0) throw new HttpError(400, "delta must be a non-zero integer.");
    if (!note) throw new HttpError(400, "A reason is required for manual adjustments.");

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product || product.factoryId !== factory.id) throw new HttpError(404, "Product not found.");

      await tx.inventory.upsert({
        where: { productId },
        create: { productId },
        update: {},
      });

      // Guarded update: never allow on-hand to drop below what is reserved or below zero.
      const updated = await tx.inventory.updateMany({
        where:
          delta < 0
            ? { productId, currentQuantity: { gte: -delta } }
            : { productId },
        data: { currentQuantity: { increment: delta } },
      });
      if (updated.count === 0) throw new HttpError(400, "Adjustment would make stock negative.");

      const inventory = await tx.inventory.findUniqueOrThrow({ where: { productId } });
      if (inventory.currentQuantity < inventory.reservedQuantity) {
        throw new HttpError(400, "Adjustment would drop stock below the reserved quantity.");
      }

      await tx.inventoryTransaction.create({
        data: { factoryId: factory.id, productId, type: "ADJUSTMENT", quantity: delta, note },
      });

      return inventory;
    });

    return NextResponse.json({ inventory: result });
  } catch (error) {
    return errorResponse(error);
  }
}
