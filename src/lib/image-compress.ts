import { IMAGE_MAX_SIDE } from "@/lib/limits";

/**
 * Shrinks and compresses an image in the browser before it is uploaded (a 3 MB phone photo becomes about 200-400 KB).
 * Non-image files (PDF) and images that are already small are returned unchanged. Output is JPEG on a white background.
 * If anything fails the original file is uploaded instead.
 */
export async function compressImage(file: File, opts: { maxSide?: number; quality?: number } = {}): Promise<File> {
  const { maxSide = IMAGE_MAX_SIDE, quality = 0.82 } = opts;
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file); // honours the photo's EXIF rotation in current browsers
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 300 * 1024) { bitmap.close(); return file; }

    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { bitmap.close(); return file; }
    ctx.fillStyle = "#ffffff"; // JPEG has no transparency
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || (scale === 1 && blob.size >= file.size)) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
