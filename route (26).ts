import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse } from "@/lib/guards";

// Right of access: everything the platform holds about the signed-in user, as a JSON download.
// passwordHash is deliberately never included.
export async function GET() {
  try {
    const { user: s } = await requireAuth({ allowUnverified: true });

    const user = await prisma.user.findUnique({
      where: { id: s.id },
      select: { id: true, email: true, name: true, role: true, phone: true, createdAt: true },
    });
    const factory = await prisma.factory.findUnique({
      where: { userId: s.id },
      include: {
        categories: { include: { category: { select: { slug: true, nameAr: true, nameEn: true } } } },
        certifications: true,
        products: { include: { inventory: true } },
      },
    });

    const quotations = await prisma.quotation.findMany({
      where: { OR: [{ clientId: s.id }, ...(factory ? [{ factoryId: factory.id }] : [])] },
      include: { offers: true },
      orderBy: { createdAt: "asc" },
    });
    const orders = await prisma.order.findMany({
      where: { OR: [{ clientId: s.id }, ...(factory ? [{ factoryId: factory.id }] : [])] },
      include: { shipment: true, production: true },
      orderBy: { createdAt: "asc" },
    });
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: s.id } } },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    const payload = {
      exportedAt: new Date().toISOString(),
      platform: "SOOQ AL BEET",
      account: user,
      factory,
      quotations,
      orders,
      conversations,
    };

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="sooq-al-beet-my-data-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
