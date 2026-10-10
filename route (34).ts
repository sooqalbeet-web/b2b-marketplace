import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFactory, requireRole, errorResponse } from "@/lib/guards";

export async function GET() {
  try {
    const session = await requireRole("FACTORY");
    const factory = await requireFactory(session.user.id);

    const orders = await prisma.order.findMany({
      where: { factoryId: factory.id },
      include: {
        product: { select: { name: true, sku: true } },
        client: { select: { name: true } },
        production: {
          select: { id: true, productionNumber: true, status: true, plannedQuantity: true, producedQuantity: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    return errorResponse(error);
  }
}
