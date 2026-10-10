import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, errorResponse } from "@/lib/guards";
import { CATEGORIES } from "@/lib/category-list";

// Admin: creates any missing categories and refreshes names. Never deletes categories (factories may use them).
export async function POST() {
  try {
    await requireRole("ADMIN");
    for (const [slug, nameAr, nameEn] of CATEGORIES) {
      await prisma.category.upsert({ where: { slug }, update: { nameAr, nameEn }, create: { slug, nameAr, nameEn } });
    }
    const total = await prisma.category.count();
    return NextResponse.json({ synced: CATEGORIES.length, total });
  } catch (error) {
    return errorResponse(error);
  }
}
