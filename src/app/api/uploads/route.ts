import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireAuth } from "@/lib/auth";
import { HttpError, errorResponse } from "@/lib/guards";

export const runtime = "nodejs";

const TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * DEV STORAGE: writes to /public/uploads on local disk.
 * In production (serverless/containers) replace the write below with S3 / R2 /
 * Cloudinary / UploadThing and return that URL. The rest of the app only stores the URL.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "No file provided.");

    const ext = TYPES[file.type];
    if (!ext) throw new HttpError(400, "Only PNG, JPEG, WebP or PDF files are allowed.");
    if (file.size > MAX_BYTES) throw new HttpError(400, "File is larger than 5 MB.");

    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });

    const name = `${randomUUID()}.${ext}`; // never trust the client filename
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ url: `/uploads/${name}` }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
