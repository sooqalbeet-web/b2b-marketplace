import { createHash, randomUUID } from "crypto";
import { HttpError } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { MAX_IMAGES_PER_FACTORY } from "@/lib/limits";

// External file storage (Cloudinary). Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to enable it.
// Without them uploads fall back to the local /public/uploads folder (development only).
const cfg = () => ({
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY,
  secret: process.env.CLOUDINARY_API_SECRET,
});

export const cloudinaryEnabled = () => {
  const c = cfg();
  return Boolean(c.cloud && c.key && c.secret);
};

/** A file URL we are willing to store: a local upload or one of OUR Cloudinary files. */
export function isTrustedFileUrl(url: unknown): url is string {
  if (typeof url !== "string" || !url || url.length > 2000 || url.includes("..")) return false;
  if (url.startsWith("/uploads/")) return true;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  return Boolean(cloud) && url.startsWith(`https://res.cloudinary.com/${cloud}/`);
}

/** A trusted file URL that points to a PDF (used for certificates and the commercial registration). */
export function isPdfFileUrl(url: unknown): url is string {
  return isTrustedFileUrl(url) && /\.pdf$/i.test(url);
}

/** Number of images stored in a product's imageUrls column (handles JSON text as well as arrays). */
export function countImages(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (typeof value === "string") {
    try { const v = JSON.parse(value); return Array.isArray(v) ? v.length : 0; } catch { return 0; }
  }
  return 0;
}

/** The whole factory may have at most MAX_IMAGES_PER_FACTORY images, spread over its products. */
export async function assertImageBudget(factoryId: string, newCount: number, excludeProductId?: string) {
  const rows = await prisma.product.findMany({
    where: { factoryId, ...(excludeProductId ? { id: { not: excludeProductId } } : {}) },
    select: { imageUrls: true },
  });
  const used = rows.reduce((n, r) => n + countImages(r.imageUrls), 0);
  if (used + newCount > MAX_IMAGES_PER_FACTORY) throw new HttpError(400, "Factory image limit reached (max 5 images).");
}

/** Validates the product image list: at most 5 trusted URLs. */
export function parseImages(raw: unknown): string[] {
  if (raw === undefined || raw === null || raw === "") return [];
  if (!Array.isArray(raw)) throw new HttpError(400, "Invalid image URL.");
  if (raw.length > MAX_IMAGES_PER_FACTORY) throw new HttpError(400, "Too many images (max 5).");
  return raw.map((u) => {
    if (!isTrustedFileUrl(u)) throw new HttpError(400, "Invalid image URL.");
    return u;
  });
}

export async function uploadToCloudinary(file: File, ext: string, folder: string): Promise<string> {
  const { cloud, key, secret } = cfg();
  const isPdf = ext === "pdf";
  const id = randomUUID();
  const publicId = isPdf ? `${id}.pdf` : id; // raw files keep their extension in the public id
  const timestamp = String(Math.floor(Date.now() / 1000));

  const signed: Record<string, string> = { folder, public_id: publicId, timestamp };
  const toSign = Object.keys(signed).sort().map((k) => `${k}=${signed[k]}`).join("&");
  const signature = createHash("sha1").update(toSign + secret).digest("hex");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", key as string);
  fd.append("timestamp", timestamp);
  fd.append("folder", folder);
  fd.append("public_id", publicId);
  fd.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${isPdf ? "raw" : "image"}/upload`, { method: "POST", body: fd });
  if (!res.ok) {
    console.error("Cloudinary upload failed", res.status, await res.text());
    throw new HttpError(502, "Could not upload the file. Try again later.");
  }
  const data = await res.json();
  return String(data.secure_url);
}
