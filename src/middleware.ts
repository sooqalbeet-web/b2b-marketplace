import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Edge-safe: uses only `jose` (no bcrypt / next/headers). API routes still enforce
// their own auth via requireAuth/requireRole; this only guards the pages.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session")?.value;

  let role: string | null = null;
  let verified = false;
  if (token && process.env.AUTH_SECRET) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
      role = String(payload.role);
      verified = payload.verified === true;
    } catch {
      role = null;
    }
  }

  if (!role) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Unverified accounts can only reach the verification page and their account/data pages.
  if (!verified && !pathname.startsWith("/verify-email") && !pathname.startsWith("/account")) {
    return NextResponse.redirect(new URL("/verify-email", request.url));
  }
  if (verified && pathname.startsWith("/verify-email")) {
    return NextResponse.redirect(new URL(role === "FACTORY" ? "/factory/dashboard" : role === "ADMIN" ? "/admin" : "/marketplace", request.url));
  }

  // /messages and /quotations/[id] are shared by both roles.
  if (pathname.startsWith("/factory") && role !== "FACTORY") {
    return NextResponse.redirect(new URL("/marketplace", request.url));
  }
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/marketplace", request.url));
  }
  if (pathname.startsWith("/orders") && role === "FACTORY") {
    return NextResponse.redirect(new URL("/factory/orders", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/factory/:path*", "/orders/:path*", "/messages/:path*", "/quotations/:path*", "/account/:path*", "/verify-email"],
};
