/**
 * Returns a resized version of a Cloudinary image (long side limited to `width` px, automatic quality and format),
 * so lists and cards download a small file instead of the original. Other URLs are returned unchanged.
 * Use a few fixed widths (120, 160, 320, 640) so each image is only transformed a few times.
 */
export function thumb(url: string | null | undefined, width: number): string {
  if (!url) return "";
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/);
  if (!m) return url;
  return `${m[1]}c_limit,w_${width},q_auto,f_auto/${m[2]}`;
}
