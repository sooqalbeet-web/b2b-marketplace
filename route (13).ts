import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { HttpError, loadQuotationForParty, errorResponse } from "@/lib/guards";

/**
 * ACCEPT: only the party that did NOT make the latest offer may accept.
 *         Accepting creates the Order from the latest offer, atomically.
 * REJECT: either party may close the quotation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const { action } = await request.json();

    if (action !== "ACCEPT" && action !== "REJECT") {
      throw new HttpError(400, "action must be ACCEPT or REJECT.");
    }

    const { party } = await loadQuotationForParty(id, session.user.id, session.user.role);

    const result = await prisma.$transaction(async (tx) => {
      // Re-read inside the transaction to avoid double-accept races.
      const quotation = await tx.quotation.findUnique({ where: { id } });
      if (!quotation) throw new HttpError(404, "Quotation not found.");

      if (!["QUOTED", "NEGOTIATION"].includes(quotation.status)) {
        throw new HttpError(400, "This quotation cannot be answered now.");
      }

      if (action === "REJECT") {
        const updated = await tx.quotation.update({
          where: { id },
          data: { status: "REJECTED" },
        });
        return { quotation: updated, order: null };
      }

      const last = await tx.quotationOffer.findFirst({
        where: { quotationId: id },
        orderBy: { createdAt: "desc" },
      });
      if (!last) throw new HttpError(400, "No offer to accept.");
      if (last.fromRole === party) {
        throw new HttpError(400, "You cannot accept your own offer.");
      }
      if (last.validUntil && last.validUntil < new Date()) {
        throw new HttpError(400, "This offer has expired.");
      }

      const updated = await tx.quotation.update({
        where: { id },
        data: { status: "ACCEPTED", quantity: last.quantity },
      });

      const order = await tx.order.create({
        data: {
          number: `ORD-${Date.now()}-${id.slice(-4)}`,
          quotationId: id,
          clientId: quotation.clientId,
          factoryId: quotation.factoryId,
          productId: quotation.productId,
          status: "CONFIRMED",
          quantity: last.quantity,
          unitPrice: last.unitPrice,
          totalPrice: Number(last.unitPrice) * last.quantity,
          deliveryDate: last.leadTimeDays
            ? new Date(Date.now() + last.leadTimeDays * 86_400_000)
            : quotation.deliveryDate,
        },
      });

      return { quotation: updated, order };
    });

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
