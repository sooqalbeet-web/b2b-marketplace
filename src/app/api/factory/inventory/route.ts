import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFactory, requireRole, errorResponse } from "@/lib/guards";

export async function GET() {
  try {
    const session = await requireRole("FACTORY");
    const factory = await requireFactory(session.user.id);

    const [products, transactions] = await Promise.all([
      prisma.product.findMany({
        where: { factoryId: factory.id },
        select: {
          id: true,
          name: true,
          sku: true,
          unit: true,
          inventory: { select: { currentQuantity: true, reservedQuantity: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.inventoryTransaction.findMany({
        where: { factoryId: factory.id },
        include: { product: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    const items = products.map((p) => {
      const onHand = p.inventory?.currentQuantity ?? 0;
      const reserved = p.inventory?.reservedQuantity ?? 0;
      return { id: p.id, name: p.name, sku: p.sku, unit: p.unit, onHand, reserved, available: onHand - reserved };
    });

    return NextResponse.json({ items, transactions });
  } catch (error) {
    return errorResponse(error);
  }
}
