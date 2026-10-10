import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, requireAuth } from "@/lib/auth";
import { errorResponse } from "@/lib/guards";
import { checkVerificationCode } from "@/lib/verification";
import { parseCode } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const { user: s } = await requireAuth({ allowUnverified: true });
    const code = parseCode((await request.json()).code);

    await checkVerificationCode(s.id, code);

    const user = await prisma.$transaction(async (tx) => {
      await tx.emailVerification.deleteMany({ where: { userId: s.id } });
      return tx.user.update({ where: { id: s.id }, data: { emailVerifiedAt: new Date() } });
    });

    await createSession({ id: user.id, role: user.role, name: user.name, verified: true });
    return NextResponse.json({ verified: true, role: user.role });
  } catch (error) {
    return errorResponse(error);
  }
}
