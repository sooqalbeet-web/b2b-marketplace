import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/guards";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      select: { id: true, slug: true, nameAr: true, nameEn: true },
    });
    categories.sort((a, b) =>
      a.slug === "other" ? 1 : b.slug === "other" ? -1 : a.nameAr.localeCompare(b.nameAr, "ar"));
    return NextResponse.json({ categories });
  } catch (error) {
    return errorResponse(error);
  }
}
