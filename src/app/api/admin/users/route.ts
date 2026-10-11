import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, errorResponse } from "@/lib/guards";

export const dynamic = "force-dynamic";

// Admin: registration statistics and the list of registered buyers and factories (never returns passwords).
export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const p = request.nextUrl.searchParams;
    const role = p.get("role");
    const q = (p.get("q") ?? "").trim();

    const where: Prisma.UserWhereInput = { deletedAt: null, role: { in: ["CLIENT", "FACTORY"] } };
    if (role === "CLIENT" || role === "FACTORY") where.role = role;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { companyName: { contains: q } },
        { factory: { is: { name: { contains: q } } } },
      ];
    }

    const base: Prisma.UserWhereInput = { deletedAt: null };
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [clients, factories, verified, last7, users] = await Promise.all([
      prisma.user.count({ where: { ...base, role: "CLIENT" } }),
      prisma.user.count({ where: { ...base, role: "FACTORY" } }),
      prisma.user.count({ where: { ...base, role: { in: ["CLIENT", "FACTORY"] }, emailVerifiedAt: { not: null } } }),
      prisma.user.count({ where: { ...base, role: { in: ["CLIENT", "FACTORY"] }, createdAt: { gte: since } } }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 300,
        select: {
          id: true, name: true, email: true, phone: true, country: true, role: true, description: true,
          companyName: true, companyCity: true, companyRegNo: true, companyTaxNo: true,
          createdAt: true, emailVerifiedAt: true,
          factory: { select: { id: true, name: true, region: true, commercialRegNo: true, taxNo: true, verification: true } },
        },
      }),
    ]);

    return NextResponse.json({
      stats: { total: clients + factories, clients, factories, verified, last7 },
      users,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
