import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, requireRole, errorResponse } from "@/lib/guards";

// SHIPPED -> DELIVERED, confirmed by the client who placed the order.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("CLIENT");
    const { id } = await params;

    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id } });
      if (!current || current.clientId !== session.user.id) throw new HttpError(404, "Order not found.");
      if (current.status !== "SHIPPED") throw new HttpError(400, "Only shipped orders can be confirmed.");

      await tx.shipment.update({ where: { orderId: id }, data: { deliveredAt: new Date() } });
      return tx.order.update({ where: { id }, data: { status: "DELIVERED" } });
    });

    return NextResponse.json({ order });
  } catch (error) {
    return errorResponse(error);
  }
}
