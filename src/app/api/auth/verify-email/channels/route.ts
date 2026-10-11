import { NextResponse } from "next/server";
import { whatsappEnabled } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// Tells the verify page which delivery channels are configured on this server.
export async function GET() {
  return NextResponse.json({ whatsapp: whatsappEnabled() });
}
