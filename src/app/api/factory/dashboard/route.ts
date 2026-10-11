import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireFactory, requireRole, errorResponse } from "@/lib/guards";

export async function GET() {
  try {
    const session = await requireRole("FACTORY");
    const factory = await requireFactory(session.user.id);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [quoteGroups, orderGroups, unread, revenue, inventories, actionable, recentOrders] =
      await Promise.all([
        prisma.quotation.groupBy({
          by: ["status"],
          where: { factoryId: factory.id },
          _count: true,
        }),
        prisma.order.groupBy({
          by: ["status"],
          where: { factoryId: factory.id },
          _count: true,
        }),
        prisma.message.count({
          where: {
            senderId: { not: session.user.id },
            readAt: null,
            conversation: { participants: { some: { userId: session.user.id } } },
          },
        }),
        prisma.order.aggregate({
          where: {
            factoryId: factory.id,
            status: { not: "CANCELLED" },
            createdAt: { gte: monthStart },
          },
          _sum: { totalPrice: true },
        }),
        prisma.inventory.findMany({
          where: { product: { factoryId: factory.id } },
          select: { currentQuantity: true, reservedQuantity: true },
        }),
        prisma.quotation.findMany({
          where: { factoryId: factory.id, status: { in: ["SENT", "RECEIVED", "NEGOTIATION"] } },
          include: {
            product: { select: { name: true } },
            client: { select: { name: true } },
            offers: { orderBy: { createdAt: "desc" }, take: 1, select: { fromRole: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 20,
        }),
        prisma.order.findMany({
          where: { factoryId: factory.id },
          select: { id: true, number: true, status: true, totalPrice: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

    const q = Object.fromEntries(quoteGroups.map((g) => [g.status, g._count]));
    const o = Object.fromEntries(orderGroups.map((g) => [g.status, g._count]));

    // Quotations waiting on the factory: brand-new, or the client made the last move.
    const needsResponse = actionable
      .filter((x) => x.status !== "NEGOTIATION" || x.offers[0]?.fromRole === "CLIENT")
      .slice(0, 5)
      .map((x) => ({
        id: x.id,
        number: x.number,
        status: x.status,
        client: x.client.name,
        product: x.product?.name ?? "Custom",
        quantity: x.quantity,
      }));

    return NextResponse.json({
      factoryName: factory.name,
      verification: factory.verification,
      stats: {
        newRequests: q.SENT ?? 0,
        negotiating: q.NEGOTIATION ?? 0,
        acceptedQuotations: q.ACCEPTED ?? 0,
        activeOrders:
          (o.CONFIRMED ?? 0) + (o.IN_PRODUCTION ?? 0) + (o.QC ?? 0) + (o.READY_TO_SHIP ?? 0),
        inProduction: o.IN_PRODUCTION ?? 0,
        unreadMessages: unread,
        monthRevenue: Number(revenue._sum.totalPrice ?? 0),
        outOfStock: inventories.filter((i) => i.currentQuantity - i.reservedQuantity <= 0).length,
      },
      needsResponse,
      recentOrders,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
