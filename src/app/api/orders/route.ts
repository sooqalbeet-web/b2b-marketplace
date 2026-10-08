import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, errorResponse } from "@/lib/guards";

export async function GET() {
  try {
    const session = await requireRole("CLIENT");

    const orders = await prisma.order.findMany({
      where: { clientId: session.user.id },
      include: {
        factory: { select: { id: true, name: true } },
        product: { select: { name: true } },
        shipment: { select: { carrier: true, trackingNumber: true, shippedAt: true, deliveredAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    return errorResponse(error);
  }
}
