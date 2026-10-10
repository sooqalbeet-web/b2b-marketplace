import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, requireFactory, requireRole, errorResponse } from "@/lib/guards";

// Edit a product or toggle it active/inactive. SKU is immutable (it is referenced in history).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("FACTORY");
    const factory = await requireFactory(session.user.id);
    const { id } = await params;
    const b = await request.json();

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.factoryId !== factory.id) throw new HttpError(404, "Product not found.");

    const data: Record<string, unknown> = {};
    if (typeof b.name === "string" && b.name.trim()) data.name = b.name.trim();
    if (typeof b.description === "string") data.description = b.description;
    if (typeof b.unit === "string" && b.unit.trim()) data.unit = b.unit.trim();
    if (typeof b.active === "boolean") data.active = b.active;
    if (b.moq !== undefined) {
      const moq = Number(b.moq);
      if (!Number.isInteger(moq) || moq < 1) throw new HttpError(400, "MOQ must be a positive integer.");
      data.moq = moq;
    }
    if (b.leadTimeDays !== undefined) {
      data.leadTimeDays = b.leadTimeDays === null || b.leadTimeDays === "" ? null : Number(b.leadTimeDays);
    }
    if (b.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: b.categoryId } });
      if (!category) throw new HttpError(404, "Category not found.");
      data.categoryId = category.id;
    }

    const updated = await prisma.product.update({ where: { id }, data });
    return NextResponse.json({ product: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
