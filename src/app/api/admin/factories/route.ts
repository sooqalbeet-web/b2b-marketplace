import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, errorResponse } from "@/lib/guards";

// Admin: factories awaiting review (default) or any verification status.
export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const status = request.nextUrl.searchParams.get("status") ?? "PENDING";
    const factories = await prisma.factory.findMany({
      where: { verification: status as never },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        certifications: true,
      },
      orderBy: { updatedAt: "asc" },
    });
    return NextResponse.json({ factories });
  } catch (error) {
    return errorResponse(error);
  }
}
