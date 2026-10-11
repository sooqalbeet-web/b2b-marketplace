import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError, requireFactory, requireRole, errorResponse } from "@/lib/guards";

export async function GET() {
  try {
    const session = await requireRole("FACTORY");
    const factory = await requireFactory(session.user.id);

    const products = await prisma.product.findMany({
      where: { factoryId: factory.id },
      include: {
        category: { select: { id: true, nameEn: true, nameAr: true } },
        inventory: { select: { currentQuantity: true, reservedQuantity: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("FACTORY");
    const factory = await requireFactory(session.user.id);
    const b = await request.json();

    const name = String(b.name ?? "").trim();
    const sku = String(b.sku ?? "").trim();
    const moq = Number(b.moq ?? 1);
    if (!name || !sku || !b.categoryId) throw new HttpError(400, "name, sku and categoryId are required.");
    if (!Number.isInteger(moq) || moq < 1) throw new HttpError(400, "MOQ must be a positive integer.");

    const category = await prisma.category.findUnique({ where: { id: b.categoryId } });
    if (!category) throw new HttpError(404, "Category not found.");

    try {
      const product = await prisma.product.create({
        data: {
          factoryId: factory.id,
          categoryId: category.id,
          name,
          sku,
          description: b.description ?? null,
          unit: b.unit || "pcs",
          moq,
          leadTimeDays: b.leadTimeDays ? Number(b.leadTimeDays) : null,
          inventory: { create: {} }, // every product starts with a zero-stock record
        },
      });

      // Make sure the factory is listed under the product's category in the directory.
      await prisma.factoryCategory.upsert({
        where: { factoryId_categoryId: { factoryId: factory.id, categoryId: category.id } },
        create: { factoryId: factory.id, categoryId: category.id },
        update: {},
      });

      return NextResponse.json({ product }, { status: 201 });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new HttpError(409, "A product with this SKU already exists.");
      }
      throw e;
    }
  } catch (error) {
    return errorResponse(error);
  }
}
