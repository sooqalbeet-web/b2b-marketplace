import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFactory, requireRole, errorResponse } from "@/lib/guards";

export async function GET() {
  try {
    const session = await requireRole("FACTORY");
    const factory = await requireFactory(session.user.id);

    const inspections = await prisma.qualityInspection.findMany({
      where: { factoryId: factory.id },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        productionOrder: { select: { id: true, productionNumber: true, plannedQuantity: true } },
        transactions: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ inspections });
  } catch (error) {
    return errorResponse(error);
  }
}
