import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { loadQuotationForParty, errorResponse } from "@/lib/guards";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const { party } = await loadQuotationForParty(id, session.user.id, session.user.role);

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        factory: { select: { id: true, name: true, region: true } },
        client: { select: { id: true, name: true } },
        offers: { orderBy: { createdAt: "asc" } },
        order: { select: { id: true, number: true, status: true } },
      },
    });

    return NextResponse.json({ quotation, party });
  } catch (error) {
    return errorResponse(error);
  }
}
