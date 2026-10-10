import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAuth, verifyPassword, hashPassword, destroySession } from "@/lib/auth";
import { HttpError, errorResponse } from "@/lib/guards";

const OPEN_QUOTATION = ["SENT", "RECEIVED", "QUOTED", "NEGOTIATION"] as const;
const ACTIVE_ORDER_DONE = ["DELIVERED", "CANCELLED"] as const;

async function removeLocalFile(url: string | null) {
  if (!url || !url.startsWith("/uploads/") || url.includes("..")) return;
  try { await unlink(path.join(process.cwd(), "public", url)); } catch { /* already gone */ }
}

/**
 * Right to erasure. Personal data is removed or anonymised. Completed orders and their
 * quotations are kept (without identity) because they carry the other party's records and
 * possible legal/financial obligations, as stated in the privacy policy.
 */
export async function POST(request: NextRequest) {
  try {
    const { user: s } = await requireAuth({ allowUnverified: true });
    if (s.role === "ADMIN") throw new HttpError(400, "Admin accounts cannot be deleted here.");

    const { password, confirm } = await request.json();
    if (confirm !== "حذف") throw new HttpError(400, "Type the confirmation word.");

    const user = await prisma.user.findUnique({ where: { id: s.id } });
    if (!user || !(await verifyPassword(String(password ?? ""), user.passwordHash))) {
      throw new HttpError(400, "Incorrect password.");
    }

    const factory = await prisma.factory.findUnique({
      where: { userId: s.id },
      include: { certifications: { select: { fileUrl: true } } },
    });
    const mine = { OR: [{ clientId: s.id }, ...(factory ? [{ factoryId: factory.id }] : [])] };

    const active = await prisma.order.count({ where: { ...mine, status: { notIn: [...ACTIVE_ORDER_DONE] } } });
    if (active > 0) {
      throw new HttpError(400, "You have active orders. Finish or cancel them before deleting your account.");
    }

    const randomHash = await hashPassword(randomBytes(24).toString("hex"));

    await prisma.$transaction(async (tx) => {
      await tx.quotation.updateMany({ where: { ...mine, status: { in: [...OPEN_QUOTATION] } }, data: { status: "REJECTED" } });
      await tx.emailVerification.deleteMany({ where: { userId: s.id } });
      await tx.message.updateMany({ where: { senderId: s.id }, data: { body: "[تم حذف الرسالة]" } });

      if (factory) {
        await tx.product.updateMany({ where: { factoryId: factory.id }, data: { active: false } });
        await tx.certification.deleteMany({ where: { factoryId: factory.id } });
        await tx.factoryCategory.deleteMany({ where: { factoryId: factory.id } });
        await tx.factory.update({
          where: { id: factory.id },
          data: {
            name: "مصنع محذوف", description: null, logoUrl: null, address: null, website: null,
            capabilities: null, shippingReturnPolicy: null, commercialRegNo: null, taxNo: null, verification: "UNVERIFIED",
            featured: false, deletedAt: new Date(),
          },
        });
      }

      await tx.user.update({
        where: { id: s.id },
        data: {
          email: `deleted-${s.id}@deleted.invalid`, name: "حساب محذوف", phone: null,
          passwordHash: randomHash, deletedAt: new Date(),
        },
      });
    });

    if (factory) {
      await Promise.all([removeLocalFile(factory.logoUrl), ...factory.certifications.map((c) => removeLocalFile(c.fileUrl))]);
    }

    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
