import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/guards";

// Public marketplace directory. Filters: q (factory name), category (slug), country (ISO code), region, cert, verified
export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams;
    const q = p.get("q")?.trim();
    const category = p.get("category");
    const region = p.get("region");
    const country = p.get("country");
    const cert = p.get("cert")?.trim();
    const verified = p.get("verified") === "1";

    const where: Prisma.FactoryWhereInput = { deletedAt: null };
    if (q) where.name = { contains: q, mode: "insensitive" };
    if (country) where.country = country;
    if (region) where.region = region;
    if (verified) where.verification = "VERIFIED";
    if (category) where.categories = { some: { category: { slug: category } } };
    if (cert) {
      where.certifications = {
        some: { name: { contains: cert, mode: "insensitive" } },
      };
    }

    const factories = await prisma.factory.findMany({
      where,
      select: {
        id: true,
        name: true,
        country: true,
        region: true,
        description: true,
        logoUrl: true,
        verification: true,
        featured: true,
        categories: { select: { category: { select: { slug: true, nameAr: true, nameEn: true } } } },
        certifications: { select: { name: true, verified: true } },
        _count: { select: { products: true } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    return NextResponse.json({ factories });
  } catch (error) {
    return errorResponse(error);
  }
}
