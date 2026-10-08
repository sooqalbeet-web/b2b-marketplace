import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, requireFactory, requireRole, errorResponse } from "@/lib/guards";

// A certification is always created unverified; only an admin review marks it verified.
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("FACTORY");
    const factory = await requireFactory(session.user.id);
    const b = await request.json();

    const name = String(b.name ?? "").trim();
    if (!name) throw new HttpError(400, "Certification name is required.");

    const fileUrl = b.fileUrl ? String(b.fileUrl) : null;
    if (fileUrl && (!fileUrl.startsWith("/uploads/") || fileUrl.includes(".."))) {
      throw new HttpError(400, "Invalid file URL.");
    }

    const date = (v: unknown) => {
      if (!v) return null;
      const d = new Date(String(v));
      if (isNaN(d.getTime())) throw new HttpError(400, "Invalid date.");
      return d;
    };

    const certification = await prisma.certification.create({
      data: {
        factoryId: factory.id,
        name,
        issuer: b.issuer ? String(b.issuer).trim() : null,
        fileUrl,
        issuedAt: date(b.issuedAt),
        expiresAt: date(b.expiresAt),
      },
    });

    return NextResponse.json({ certification }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
