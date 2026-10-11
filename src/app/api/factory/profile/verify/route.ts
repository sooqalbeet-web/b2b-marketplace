import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, requireFactory, requireRole, errorResponse } from "@/lib/guards";

// UNVERIFIED / REJECTED -> PENDING. An admin (not built yet) moves it to VERIFIED or REJECTED.
export async function POST() {
  try {
    const session = await requireRole("FACTORY");
    const factory = await requireFactory(session.user.id);

    if (!["UNVERIFIED", "REJECTED"].includes(factory.verification)) {
      throw new HttpError(400, "Verification is already pending or approved.");
    }

    const [withDocs, hasBasics] = await Promise.all([
      prisma.certification.count({ where: { factoryId: factory.id, fileUrl: { not: null } } }),
      Promise.resolve(Boolean(factory.description && factory.address)),
    ]);

    if (!factory.commercialRegNo || !factory.taxNo) {
      throw new HttpError(400, "Add your commercial registration and tax numbers to your profile first.");
    }
    if (withDocs === 0) throw new HttpError(400, "Upload at least one certification document first.");
    if (!hasBasics) throw new HttpError(400, "Add a description and an address to your profile first.");

    const updated = await prisma.factory.update({
      where: { id: factory.id },
      data: { verification: "PENDING" },
      select: { verification: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
