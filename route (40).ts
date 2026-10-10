import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, requireFactory, requireRole, errorResponse } from "@/lib/guards";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("FACTORY");
    const factory = await requireFactory(session.user.id);
    const { id } = await params;

    const cert = await prisma.certification.findUnique({ where: { id } });
    if (!cert || cert.factoryId !== factory.id) throw new HttpError(404, "Certification not found.");

    await prisma.certification.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
