import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { HttpError, errorResponse } from "@/lib/guards";
import { issueVerificationCode } from "@/lib/verification";
import { normalizeMobile, normalizeRegNo, normalizeTaxNo } from "@/lib/validators";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public sign-up for CLIENT and FACTORY accounts. ADMIN can never be self-registered.
export async function POST(request: NextRequest) {
  try {
    const b = await request.json();

    const email = String(b.email ?? "").trim().toLowerCase();
    const name = String(b.name ?? "").trim();
    const password = String(b.password ?? "");
    const role = b.role;

    if (!EMAIL.test(email)) throw new HttpError(400, "Invalid email.");
    if (!name) throw new HttpError(400, "Name is required.");
    if (password.length < 8) throw new HttpError(400, "Password must be at least 8 characters.");
    if (role !== "CLIENT" && role !== "FACTORY") throw new HttpError(400, "Invalid account type.");

    const factoryName = String(b.factoryName ?? "").trim();
    const region = String(b.region ?? "").trim();
    if (role === "FACTORY" && (!factoryName || !region)) {
      throw new HttpError(400, "Factory name and region are required.");
    }

    const phone = normalizeMobile(b.phone);
    const commercialRegNo = role === "FACTORY" ? normalizeRegNo(b.commercialRegNo) : null;
    const taxNo = role === "FACTORY" ? normalizeTaxNo(b.taxNo) : null;

    const passwordHash = await hashPassword(password);

    try {
      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          role,
          phone,
          ...(role === "FACTORY"
            ? { factory: { create: { name: factoryName, region, commercialRegNo, taxNo } } }
            : {}),
        },
      });

      await createSession({ id: user.id, role: user.role, name: user.name, verified: false });
      try { await issueVerificationCode(user.id, user.email); } catch (e) { console.error("verification email failed", e); }
      return NextResponse.json(
        { user: { id: user.id, name: user.name, role: user.role, verified: false } },
        { status: 201 }
      );
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const target = JSON.stringify(e.meta?.target ?? "");
        if (target.includes("commercialRegNo")) {
          throw new HttpError(409, "This commercial registration number is already registered.");
        }
        throw new HttpError(409, "An account with this email already exists.");
      }
      throw e;
    }
  } catch (error) {
    return errorResponse(error);
  }
}
