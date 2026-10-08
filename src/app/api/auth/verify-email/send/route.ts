import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, requireAuth } from "@/lib/auth";
import { errorResponse } from "@/lib/guards";
import { issueVerificationCode } from "@/lib/verification";

// Emails a fresh 6-digit code to the signed-in (unverified) user. 60-second cooldown between sends.
export async function POST() {
  try {
    const { user: s } = await requireAuth({ allowUnverified: true });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: s.id } });

    if (user.emailVerifiedAt) {
      await createSession({ id: user.id, role: user.role, name: user.name, verified: true }); // refresh stale cookie
      return NextResponse.json({ verified: true });
    }

    await issueVerificationCode(user.id, user.email, { enforceCooldown: true });
    return NextResponse.json({ sent: true });
  } catch (error) {
    return errorResponse(error);
  }
}
