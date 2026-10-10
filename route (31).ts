import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, errorResponse } from "@/lib/guards";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const factory = await prisma.factory.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        country: true,
        region: true,
        address: true,
        website: true,
        capabilities: true,
        shippingReturnPolicy: true,
        verification: true,
        categories: { select: { category: { select: { slug: true, nameAr: true, nameEn: true } } } },
        certifications: {
          select: { id: true, name: true, issuer: true, expiresAt: true, verified: true },
        },
        products: {
          where: { active: true },
          select: { id: true, name: true, sku: true, unit: true, moq: true, leadTimeDays: true, imageUrls: true },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!factory) throw new HttpError(404, "Factory not found.");
    return NextResponse.json({ factory });
  } catch (error) {
    return errorResponse(error);
  }
}
