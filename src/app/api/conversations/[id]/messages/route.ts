import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { HttpError, errorResponse } from "@/lib/guards";

async function assertParticipant(conversationId: string, userId: string) {
  const p = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!p) throw new HttpError(403, "Access denied.");
}

// Read the thread and mark the other side's messages as read.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    await assertParticipant(id, session.user.id);

    const [messages] = await prisma.$transaction([
      prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: "asc" },
        take: 200,
      }),
      prisma.message.updateMany({
        where: { conversationId: id, senderId: { not: session.user.id }, readAt: null },
        data: { readAt: new Date() },
      }),
    ]);

    return NextResponse.json({ messages, me: session.user.id });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    await assertParticipant(id, session.user.id);

    const { body } = await request.json();
    const text = typeof body === "string" ? body.trim() : "";
    if (!text) throw new HttpError(400, "Message is empty.");
    if (text.length > 4000) throw new HttpError(400, "Message is too long.");

    const message = await prisma.message.create({
      data: { conversationId: id, senderId: session.user.id, body: text },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
