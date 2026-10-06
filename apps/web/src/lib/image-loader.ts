"use client";

type ImageLoaderParams = { src: string; width: number; quality?: number };

const CLOUDINARY_UPLOAD_SEGMENT = "/image/upload/";

/**
 * `next/image` loader (next.config.ts `images.loaderFile`): each image is resized and converted by
 * its own CDN at the width `next/image` asks for, so the Next.js server never downloads originals.
 * - Cloudinary (ADMIN uploads): `f_auto` (AVIF/WebP), `q_auto`, `c_limit` (never upscales).
 * - Unsplash (seed placeholders): `w`, `q` and `auto=format`.
 * Anything else is served as is.
 */
export default function imageLoader({ src, width, quality }: ImageLoaderParams): string {
  if (!src.startsWith("https://")) return src;
  const url = new URL(src);

  if (url.hostname === "res.cloudinary.com" && url.pathname.includes(CLOUDINARY_UPLOAD_SEGMENT)) {
    return src.replace(CLOUDINARY_UPLOAD_SEGMENT, `${CLOUDINARY_UPLOAD_SEGMENT}f_auto,q_auto,c_limit,w_${width}/`);
  }
  if (url.hostname === "images.unsplash.com") {
    url.searchParams.set("auto", "format");
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    return url.toString();
  }
  return src;
}
