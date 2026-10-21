import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, errorResponse } from "@/lib/guards";
import { countryByCode } from "@/lib/countries";
import { buildXlsx, type Cell } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

const VERIFICATION: Record<string, string> = { VERIFIED: "موثّق", PENDING: "قيد المراجعة", UNVERIFIED: "غير موثّق", REJECTED: "مرفوض" };
const HEADERS = [
  "م", "النوع", "الاسم", "البريد الإلكتروني", "الهاتف", "الدولة", "اسم الشركة / المصنع", "المدينة / المنطقة",
  "السجل التجاري", "الرقم الضريبي", "حالة التوثيق", "البريد موثّق", "تاريخ التسجيل", "النبذة / الوصف",
];
const WIDTHS = [6, 12, 24, 30, 18, 16, 28, 18, 18, 16, 14, 12, 14, 60];

// Admin: downloads the registered buyers and factories as an Excel (.xlsx) file. Same filters as the admin list
// (role, q). Passwords are never included.
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

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: {
        name: true, email: true, phone: true, country: true, role: true, description: true,
        companyName: true, companyCity: true, companyRegNo: true, companyTaxNo: true,
        createdAt: true, emailVerifiedAt: true,
        factory: { select: { name: true, region: true, commercialRegNo: true, taxNo: true, verification: true, description: true } },
      },
    });

    const rows: Cell[][] = [HEADERS];
    users.forEach((u, i) => {
      const isFactory = u.role === "FACTORY";
      const f = u.factory;
      rows.push([
        i + 1,
        isFactory ? "مصنع" : "تاجر / مشترٍ",
        u.name,
        u.email,
        u.phone,
        countryByCode(u.country)?.ar ?? u.country,
        isFactory ? f?.name : u.companyName,
        isFactory ? f?.region : u.companyCity,
        isFactory ? f?.commercialRegNo : u.companyRegNo,
        isFactory ? f?.taxNo : u.companyTaxNo,
        isFactory ? (f ? VERIFICATION[f.verification] ?? f.verification : "") : "—",
        u.emailVerifiedAt ? "نعم" : "لا",
        u.createdAt.toISOString().slice(0, 10),
        isFactory ? f?.description : u.description,
      ]);
    });

    const file = buildXlsx("المسجلون", rows, WIDTHS);
    const name = `registrants-${new Date().toISOString().slice(0, 10)}.xlsx`;
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
