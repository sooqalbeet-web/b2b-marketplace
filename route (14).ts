import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { HttpError, loadQuotationForParty, errorResponse } from "@/lib/guards";

/**
 * Factory or client submits an offer / counter-offer.
 * Every round is a new QuotationOffer row (full negotiation history).
 *
 *  SENT --factory offer--> QUOTED --client counter--> NEGOTIATION <--> (factory/client counters)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const { quotation, party } = await loadQuotationForParty(
      id, session.user.id, session.user.role
    );

    const unitPrice = Number(body.unitPrice);
    const quantity = Number(body.quantity ?? quotation.quantity);
    if (!(unitPrice > 0)) throw new HttpError(400, "Invalid unit price.");
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new HttpError(400, "Invalid quantity.");
    }

    const open = ["SENT", "RECEIVED", "QUOTED", "NEGOTIATION"];
    if (!open.includes(quotation.status)) {
      throw new HttpError(400, "This quotation is closed.");
    }

    // The client cannot open the negotiation: the factory must quote first.
    if (party === "CLIENT" && ["SENT", "RECEIVED"].includes(quotation.status)) {
      throw new HttpError(400, "Waiting for the factory's quotation.");
    }

    // No back-to-back offers from the same side.
    const last = await prisma.quotationOffer.findFirst({
      where: { quotationId: quotation.id },
      orderBy: { createdAt: "desc" },
    });
    if (last && last.fromRole === party) {
      throw new HttpError(400, "Waiting for the other party to respond.");
    }

    const nextStatus = party === "FACTORY" && !last ? "QUOTED" : "NEGOTIATION";

    const result = await prisma.$transaction(async (tx) => {
      const offer = await tx.quotationOffer.create({
        data: {
          quotationId: quotation.id,
          fromRole: party,
          unitPrice,
          quantity,
          leadTimeDays: body.leadTimeDays ?? null,
          paymentTerms: body.paymentTerms ?? null,
          shippingTerms: body.shippingTerms ?? null,
          note: body.note ?? null,
          validUntil: body.validUntil ? new Date(body.validUntil) : null,
        },
      });

      const updated = await tx.quotation.update({
        where: { id: quotation.id },
        data: { status: nextStatus },
      });

      return { offer, quotation: updated };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
