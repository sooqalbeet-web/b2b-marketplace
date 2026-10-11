import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";
import { ar } from "@/lib/errors-ar";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireRole(role: "CLIENT" | "FACTORY" | "ADMIN") {
  const session = await requireAuth();
  if (session.user.role !== role) throw new HttpError(403, "Unauthorized.");
  return session;
}

export async function requireFactory(userId: string) {
  const factory = await prisma.factory.findUnique({ where: { userId } });
  if (!factory) throw new HttpError(404, "Factory not found.");
  return factory;
}

/** Loads a quotation and verifies the caller is its client or its factory. */
export async function loadQuotationForParty(id: string, userId: string, role: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { factory: { select: { userId: true } } },
  });
  if (!quotation) throw new HttpError(404, "Quotation not found.");

  const isClient = role === "CLIENT" && quotation.clientId === userId;
  const isFactory = role === "FACTORY" && quotation.factory.userId === userId;
  if (!isClient && !isFactory) throw new HttpError(403, "Access denied.");

  return { quotation, party: (isClient ? "CLIENT" : "FACTORY") as "CLIENT" | "FACTORY" };
}

export function errorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: ar(error.message) }, { status: error.status });
  }
  if (error instanceof HttpError) {
    return Response.json({ error: ar(error.message) }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: ar("Internal server error.") }, { status: 500 });
}
