import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Role = "CLIENT" | "FACTORY" | "ADMIN";
export type SessionUser = { id: string; role: Role; name: string; verified: boolean };

export class AuthError extends Error {
  status = 401;
  constructor(message = "Authentication required.") {
    super(message);
  }
}

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (32+ characters).");
  return new TextEncoder().encode(s);
}

export class UnverifiedError extends AuthError {
  status = 403;
  constructor() {
    super("Email not verified.");
  }
}

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ role: user.role, name: user.name, verified: user.verified })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<{ user: SessionUser } | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const u = await prisma.user.findUnique({ where: { id: payload.sub }, select: { deletedAt: true, emailVerifiedAt: true } });
    if (!u || u.deletedAt) return null;
    return {
      user: { id: payload.sub, role: payload.role as Role, name: String(payload.name ?? ""), verified: Boolean(u.emailVerifiedAt) },
    };
  } catch {
    return null;
  }
}

export async function requireAuth(opts?: { allowUnverified?: boolean }) {
  const session = await getSession();
  if (!session) throw new AuthError();
  if (!opts?.allowUnverified && !session.user.verified) throw new UnverifiedError();
  return session;
}
