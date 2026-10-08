import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { HttpError, requireFactory, requireRole, errorResponse } from "@/lib/guards";

// Client: create a quotation request (RFQ) to a factory.
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("CLIENT");
    const body = await request.json();

    const quantity = Number(body.quantity);
    if (!body.factoryId || !Number.isInteger(quantity) || quantity <= 0) {
      throw new HttpError(400, "factoryId and a positive integer quantity are required.");
    }

    const factory = await prisma.factory.findUnique({ where: { id: body.factoryId } });
    if (!factory) throw new HttpError(404, "Factory not found.");

    if (body.productId) {
      const product = await prisma.product.findFirst({
        where: { id: body.productId, factoryId: factory.id, active: true },
      });
      if (!product) throw new HttpError(404, "Product not found for this factory.");
      if (quantity < product.moq) {
        throw new HttpError(400, `Minimum order quantity is ${product.moq}.`);
      }
    }

    const quotation = await prisma.quotation.create({
      data: {
        number: `QT-${Date.now()}-${session.user.id.slice(-4)}`,
        clientId: session.user.id,
        factoryId: factory.id,
        productId: body.productId ?? null,
        quantity,
        specs: body.specs ?? null,
        targetPrice: body.targetPrice ?? null,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
      },
    });

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

// Client sees their own requests; factory sees requests sent to it.
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const status = request.nextUrl.searchParams.get("status") ?? undefined;

    let where: Record<string, unknown>;
    if (session.user.role === "CLIENT") {
      where = { clientId: session.user.id };
    } else if (session.user.role === "FACTORY") {
      const factory = await requireFactory(session.user.id);
      where = { factoryId: factory.id };
    } else {
      throw new HttpError(403, "Unauthorized.");
    }
    if (status) where.status = status;

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        factory: { select: { id: true, name: true } },
        offers: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ quotations });
  } catch (error) {
    return errorResponse(error);
  }
}
