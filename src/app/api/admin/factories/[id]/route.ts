import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, requireRole, errorResponse } from "@/lib/guards";

// Admin: PENDING -> VERIFIED | REJECTED. Approving also marks its uploaded certifications verified.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const { action } = await request.json();
    if (action !== "APPROVE" && action !== "REJECT") throw new HttpError(400, "action must be APPROVE or REJECT.");

    const factory = await prisma.factory.findUnique({ where: { id } });
    if (!factory) throw new HttpError(404, "Factory not found.");
    if (factory.verification !== "PENDING") throw new HttpError(400, "Only pending factories can be reviewed.");

    const updated = await prisma.$transaction(async (tx) => {
      if (action === "APPROVE") {
        await tx.certification.updateMany({ where: { factoryId: id, fileUrl: { not: null } }, data: { verified: true } });
      }
      return tx.factory.update({
        where: { id },
        data: { verification: action === "APPROVE" ? "VERIFIED" : "REJECTED" },
        select: { id: true, verification: true },
      });
    });
    return NextResponse.json({ factory: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
