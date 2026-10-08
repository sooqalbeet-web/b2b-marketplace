import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { HttpError, requireRole, errorResponse } from "@/lib/guards";

// List my conversations with the other party, last message and unread count.
export async function GET() {
  try {
    const session = await requireAuth();
    const me = session.user.id;

    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: me } } },
      include: {
        participants: {
          where: { userId: { not: me } },
          include: { user: { select: { id: true, name: true, factory: { select: { name: true } } } } },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    const withUnread = await Promise.all(
      conversations.map(async (c) => ({
        id: c.id,
        other: c.participants[0]?.user
          ? { id: c.participants[0].user.id, name: c.participants[0].user.factory?.name ?? c.participants[0].user.name }
          : null,
        lastMessage: c.messages[0] ?? null,
        unread: await prisma.message.count({
          where: { conversationId: c.id, senderId: { not: me }, readAt: null },
        }),
      }))
    );

    withUnread.sort(
      (a, b) =>
        new Date(b.lastMessage?.createdAt ?? 0).getTime() -
        new Date(a.lastMessage?.createdAt ?? 0).getTime()
    );

    return NextResponse.json({ conversations: withUnread });
  } catch (error) {
    return errorResponse(error);
  }
}

// Client starts (or reuses) a conversation with a factory.
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("CLIENT");
    const { factoryId } = await request.json();
    if (!factoryId) throw new HttpError(400, "factoryId is required.");

    const factory = await prisma.factory.findUnique({
      where: { id: factoryId },
      select: { userId: true },
    });
    if (!factory) throw new HttpError(404, "Factory not found.");

    const me = session.user.id;
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: me } } },
          { participants: { some: { userId: factory.userId } } },
        ],
      },
    });
    if (existing) return NextResponse.json({ conversation: existing });

    const conversation = await prisma.conversation.create({
      data: {
        participants: { create: [{ userId: me }, { userId: factory.userId }] },
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
