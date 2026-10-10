import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, errorResponse } from "@/lib/guards";

// Demo factories are the ones created by the seed script (commercial registration number starts with "DEMO-").
const demoWhere = { commercialRegNo: { startsWith: "DEMO-" } };

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const factories = await prisma.factory.findMany({ where: demoWhere, select: { id: true, name: true } });
    return NextResponse.json({ factories });
  } catch (error) {
    return errorResponse(error);
  }
}

// Admin: permanently deletes the demo factories with their accounts, products, quotations, orders and conversations.
export async function POST() {
  try {
    await requireRole("ADMIN");
    const factories = await prisma.factory.findMany({ where: demoWhere, select: { id: true, userId: true } });
    const fids = factories.map((f) => f.id);
    const uids = factories.map((f) => f.userId);
    if (fids.length === 0) return NextResponse.json({ deleted: 0 });

    await prisma.$transaction(async (tx) => {
      await tx.qualityTransaction.deleteMany({ where: { qualityInspection: { factoryId: { in: fids } } } });
      await tx.qualityInspection.deleteMany({ where: { factoryId: { in: fids } } });
      await tx.productionOrder.deleteMany({ where: { factoryId: { in: fids } } });
      await tx.shipment.deleteMany({ where: { order: { factoryId: { in: fids } } } });
      await tx.inventoryTransaction.deleteMany({ where: { factoryId: { in: fids } } });
      await tx.order.deleteMany({ where: { factoryId: { in: fids } } });
      await tx.quotation.deleteMany({ where: { factoryId: { in: fids } } });
      await tx.product.deleteMany({ where: { factoryId: { in: fids } } });
      await tx.factoryCategory.deleteMany({ where: { factoryId: { in: fids } } });
      await tx.factory.deleteMany({ where: { id: { in: fids } } });

      const convs = await tx.conversationParticipant.findMany({ where: { userId: { in: uids } }, select: { conversationId: true } });
      await tx.conversation.deleteMany({ where: { id: { in: convs.map((c) => c.conversationId) } } });
      await tx.user.deleteMany({ where: { id: { in: uids } } });
    });

    return NextResponse.json({ deleted: fids.length });
  } catch (error) {
    return errorResponse(error);
  }
}
