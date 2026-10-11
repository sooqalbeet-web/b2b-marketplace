import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, requireAuth } from "@/lib/auth";
import { HttpError, errorResponse } from "@/lib/guards";
import { issueVerificationCode } from "@/lib/verification";
import { whatsappEnabled } from "@/lib/whatsapp";

// Sends a fresh 6-digit code to the signed-in (unverified) user by email (default) or WhatsApp. 60-second cooldown between sends.
export async function POST(request: Request) {
  try {
    const { user: s } = await requireAuth({ allowUnverified: true });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: s.id } });

    if (user.emailVerifiedAt) {
      await createSession({ id: user.id, role: user.role, name: user.name, verified: true }); // refresh stale cookie
      return NextResponse.json({ verified: true });
    }

    const body = await request.json().catch(() => ({}));
    const channel = body?.channel === "whatsapp" ? "whatsapp" : "email";
    if (channel === "whatsapp" && !whatsappEnabled()) throw new HttpError(400, "WhatsApp verification is not available.");

    await issueVerificationCode(user.id, user.email, { enforceCooldown: true, channel, phone: user.phone });
    return NextResponse.json({ sent: true, channel });
  } catch (error) {
    return errorResponse(error);
  }
}
