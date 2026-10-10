import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// TEMPORARY diagnostic page: open /api/health in the browser to see why the server fails. Delete this file after the site works.
export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const out: Record<string, unknown> = {
    databaseUrlSet: Boolean(url),
    databaseProtocol: url.split("://")[0] || null,
    authSecretOk: (process.env.AUTH_SECRET ?? "").length >= 32,
    smtpHostSet: Boolean(process.env.SMTP_HOST),
  };
  const fail = (e: unknown) => {
    const err = e as { code?: string; message?: string };
    return { code: err.code ?? null, message: String(err.message ?? e).replace(/\w+:\/\/\S+/g, "[url]").split("\n").filter(Boolean).slice(-2).join(" ").slice(0, 300) };
  };
  try {
    await prisma.$queryRaw`SELECT 1`;
    out.dbConnection = "ok";
  } catch (e) {
    out.dbConnection = "failed";
    out.dbError = fail(e);
    return NextResponse.json(out);
  }
  try {
    out.users = await prisma.user.count();
    out.admins = await prisma.user.count({ where: { role: "ADMIN" } });
    out.categories = await prisma.category.count();
    out.tables = "ok";
  } catch (e) {
    out.tables = "missing-or-error";
    out.tablesError = fail(e);
  }
  return NextResponse.json(out);
}
