import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { HttpError, errorResponse } from "@/lib/guards";

// Dummy hash so a missing user takes as long as a wrong password (no account enumeration by timing).
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8e7Qy1m3sXk0pQ0c9bX0K1b6mZ5y6e";

export async function POST(request: NextRequest) {
  try {
    const b = await request.json();
    const email = String(b.email ?? "").trim().toLowerCase();
    const password = String(b.password ?? "");

    const user = await prisma.user.findUnique({ where: { email } });
    const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !ok) throw new HttpError(401, "Incorrect email or password.");

    const verified = Boolean(user.emailVerifiedAt);
    await createSession({ id: user.id, role: user.role, name: user.name, verified });
    return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role, verified } });
  } catch (error) {
    return errorResponse(error);
  }
}
