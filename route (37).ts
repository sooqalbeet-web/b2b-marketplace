import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { HttpError, requireFactory, requireRole, errorResponse } from "@/lib/guards";
import { normalizeRegNo, normalizeTaxNo } from "@/lib/validators";

const isHttp = (s: string) => /^https?:\/\/\S+$/i.test(s);
const isLocalUpload = (s: string) => s.startsWith("/uploads/") && !s.includes("..");

export async function GET() {
  try {
    const session = await requireRole("FACTORY");
    const base = await requireFactory(session.user.id);

    const factory = await prisma.factory.findUnique({
      where: { id: base.id },
      include: {
        categories: { select: { categoryId: true } },
        certifications: { orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json({ factory });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireRole("FACTORY");
    const factory = await requireFactory(session.user.id);
    const b = await request.json();

    const data: Record<string, unknown> = {};
    if (b.name !== undefined) {
      if (!String(b.name).trim()) throw new HttpError(400, "Name cannot be empty.");
      data.name = String(b.name).trim();
    }
    if (b.region !== undefined) {
      if (!String(b.region).trim()) throw new HttpError(400, "Region cannot be empty.");
      data.region = String(b.region).trim();
    }
    for (const k of ["description", "address", "capabilities", "shippingReturnPolicy"] as const) {
      if (b[k] !== undefined) data[k] = String(b[k]).trim() || null;
    }
    if (b.website !== undefined) {
      const w = String(b.website).trim();
      if (w && !isHttp(w)) throw new HttpError(400, "Website must start with http:// or https://");
      data.website = w || null;
    }
    if (b.logoUrl !== undefined) {
      if (b.logoUrl && !isLocalUpload(b.logoUrl) && !isHttp(b.logoUrl)) throw new HttpError(400, "Invalid logo URL.");
      data.logoUrl = b.logoUrl || null;
    }

    // Registry numbers can be set once (legacy accounts); after that only support can change them.
    for (const [key, norm] of [["commercialRegNo", normalizeRegNo], ["taxNo", normalizeTaxNo]] as const) {
      if (b[key] === undefined || b[key] === "" || b[key] === factory[key]) continue;
      if (factory[key]) throw new HttpError(400, "Registration and tax numbers cannot be changed once saved. Contact support.");
      data[key] = norm(b[key]);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (Array.isArray(b.categoryIds)) {
        const valid = await tx.category.findMany({
          where: { id: { in: b.categoryIds } },
          select: { id: true },
        });
        await tx.factoryCategory.deleteMany({ where: { factoryId: factory.id } });
        await tx.factoryCategory.createMany({
          data: valid.map((c) => ({ factoryId: factory.id, categoryId: c.id })),
        });
      }
      return tx.factory.update({ where: { id: factory.id }, data });
    });

    return NextResponse.json({ factory: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse(new HttpError(409, "This commercial registration number is already registered."));
    }
    return errorResponse(error);
  }
}
