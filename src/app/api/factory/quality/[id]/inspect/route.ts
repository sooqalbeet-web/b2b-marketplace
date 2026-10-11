import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, requireFactory, requireRole, errorResponse } from "@/lib/guards";

/**
 * Submits a QC result. Only PASSED units become finished-goods stock
 * (QUALITY_PASS). Failed units are logged and never reach inventory.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("FACTORY");
    const factory = await requireFactory(session.user.id);
    const { id } = await params;
    const body = await request.json();

    const passed = Number(body.passedQuantity);
    const failed = Number(body.failedQuantity ?? 0);
    if (!Number.isInteger(passed) || passed < 0) throw new HttpError(400, "Invalid passed quantity.");
    if (!Number.isInteger(failed) || failed < 0) throw new HttpError(400, "Invalid failed quantity.");

    const result = await prisma.$transaction(async (tx) => {
      // Re-read inside the transaction so a double submit cannot add stock twice.
      const inspection = await tx.qualityInspection.findUnique({
        where: { id },
        include: { productionOrder: { select: { orderId: true } } },
      });
      if (!inspection || inspection.factoryId !== factory.id) {
        throw new HttpError(404, "Inspection not found.");
      }
      if (inspection.status !== "PENDING") {
        throw new HttpError(400, "This inspection has already been processed.");
      }
      if (passed + failed !== inspection.inspectedQuantity) {
        throw new HttpError(400, "Passed + failed must equal inspected quantity.");
      }

      const status = failed === 0 ? "PASSED" : passed === 0 ? "FAILED" : "PARTIAL";

      const updated = await tx.qualityInspection.update({
        where: { id },
        data: {
          status,
          passedQuantity: passed,
          failedQuantity: failed,
          inspectedById: session.user.id,
          inspectedAt: new Date(),
          notes: body.notes ?? inspection.notes,
        },
      });

      if (passed > 0) {
        await tx.qualityTransaction.create({
          data: { qualityInspectionId: id, type: "PASS", quantity: passed, note: body.notes ?? "QC passed." },
        });

        if (inspection.productId) {
          await tx.inventory.upsert({
            where: { productId: inspection.productId },
            create: { productId: inspection.productId, currentQuantity: passed },
            update: { currentQuantity: { increment: passed } },
          });
          await tx.inventoryTransaction.create({
            data: {
              factoryId: inspection.factoryId,
              productId: inspection.productId,
              type: "QUALITY_PASS",
              quantity: passed,
              reference: inspection.inspectionNumber,
              note: `QC passed ${passed} units.`,
            },
          });
        }
      }

      if (failed > 0) {
        await tx.qualityTransaction.create({
          data: { qualityInspectionId: id, type: "FAIL", quantity: failed, note: body.failureReason ?? "QC failed." },
        });
      }

      // Order is ready to ship once something passed; a fully failed batch stays in QC for rework.
      if (passed > 0) {
        await tx.order.update({
          where: { id: inspection.productionOrder.orderId },
          data: { status: "READY_TO_SHIP" },
        });
      }

      return updated;
    });

    return NextResponse.json({ inspection: result });
  } catch (error) {
    return errorResponse(error);
  }
}
