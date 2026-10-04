/** Image formats ADMIN can upload, checked by the file's bytes on the server (not by its name or MIME type). */
export const PROPERTY_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type PropertyImageType = (typeof PROPERTY_IMAGE_TYPES)[number];

/** 5 MB: enough for a good photo, well under Cloudinary's free-plan limit (10 MB). */
export const MAX_PROPERTY_IMAGE_BYTES = 5 * 1024 * 1024;

/** Multipart field of `POST /api/admin/properties/{id}/images`. */
export const PROPERTY_IMAGE_FIELD = "file";

export const PROPERTY_IMAGE_MESSAGES = {
  missing: "Selecciona una imagen",
  empty: "La imagen está vacía",
  tooLarge: `La imagen supera ${MAX_PROPERTY_IMAGE_BYTES / (1024 * 1024)} MB`,
  invalidType: "Formato no permitido: usa JPG, PNG o WebP",
} as const;

/**
 * Format of an image by its first bytes (its "magic number"), or null when it is not an allowed one.
 * A renamed file (e.g. a PDF called foto.jpg) is rejected.
 */
export function detectPropertyImageType(bytes: Uint8Array): PropertyImageType | null {
  const startsWith = (signature: number[], offset = 0) => signature.every((byte, index) => bytes[offset + index] === byte);
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // "RIFF" <size> "WEBP"
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}
