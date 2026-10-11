import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, requireFactory, requireRole, errorResponse } from "@/lib/guards";

/**
 * Records produced units. When the plan is reached (or `complete: true` is sent
 * to close early) the production is COMPLETED, a PENDING QC inspection is created
 * for the whole produced quantity, and the order moves to QC.
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

    const produced = Number(body.producedQuantity);
    if (!Number.isInteger(produced) || produced <= 0) {
      throw new HttpError(400, "producedQuantity must be a positive integer.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const production = await tx.productionOrder.findUnique({ where: { id } });
      if (!production || production.factoryId !== factory.id) {
        throw new HttpError(404, "Production not found.");
      }
      if (production.status !== "IN_PROGRESS") {
        throw new HttpError(400, "Production is not in progress.");
      }

      const total = production.producedQuantity + produced;
      if (total > production.plannedQuantity) {
        throw new HttpError(
          400,
          `Exceeds plan: ${production.plannedQuantity - production.producedQuantity} units remaining.`
        );
      }

      const done = total === production.plannedQuantity || body.complete === true;

      const updated = await tx.productionOrder.update({
        where: { id },
        data: {
          producedQuantity: total,
          ...(done ? { status: "COMPLETED", completedAt: new Date() } : {}),
        },
      });

      let inspection = null;
      if (done) {
        inspection = await tx.qualityInspection.create({
          data: {
            inspectionNumber: `QC-${Date.now()}-${production.id.slice(-4)}`,
            productionOrderId: production.id,
            factoryId: production.factoryId,
            productId: production.productId,
            inspectedQuantity: total,
            notes: "Production completed and awaiting quality inspection.",
          },
        });
        await tx.order.update({ where: { id: production.orderId }, data: { status: "QC" } });
      }

      return { production: updated, inspection };
    });

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
