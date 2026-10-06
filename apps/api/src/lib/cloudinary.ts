import "server-only";
import { createHash } from "node:crypto";
import { ApiError } from "@/lib/http/api-error";

/** Cloudinary folder of the images uploaded by ADMIN. */
export const PROPERTY_IMAGES_FOLDER = "propiedades-claude";

/**
 * Incoming transformation applied before storing an upload: at most 2560 px on its longest side
 * (never upscaled). Big enough for the widest gallery on a high-density screen, while a 6000 px
 * camera photo is not kept as is. Delivery sizes are then made per request (`next/image` loader).
 */
export const UPLOAD_TRANSFORMATION = "c_limit,w_2560,h_2560";

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };

function readConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Cloudinary is not configured: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET");
    throw new ApiError(503, "La subida de imágenes no está disponible");
  }
  return { cloudName, apiKey, apiSecret };
}

/**
 * Signature of an authenticated Upload API request: the parameters sorted by name as
 * `key=value&…`, followed by the API secret, hashed with SHA-1 (hex).
 * `file`, `api_key`, `resource_type` and `cloud_name` are never signed.
 */
export function signCloudinaryParams(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

async function callUploadApi(action: "upload" | "destroy", params: Record<string, string>, file?: Blob) {
  const { cloudName, apiKey, apiSecret } = readConfig();
  const signed = { ...params, timestamp: String(Math.floor(Date.now() / 1000)) };
  const body = new FormData();
  if (file) body.set("file", file);
  for (const [key, value] of Object.entries(signed)) body.set(key, value);
  body.set("api_key", apiKey);
  body.set("signature", signCloudinaryParams(signed, apiSecret));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/${action}`, {
    method: "POST",
    body,
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    // Cloudinary's message may describe the account: logged, not returned to the client.
    console.error(`Cloudinary ${action} failed (HTTP ${response.status})`, result);
    // Rejected credentials or an API key without the needed permissions: retrying will not help.
    if (response.status === 401 || response.status === 403) {
      throw new ApiError(503, "La subida de imágenes no está disponible: revisa la configuración de Cloudinary.");
    }
    throw new ApiError(502, "No fue posible guardar la imagen en Cloudinary. Inténtalo de nuevo.");
  }
  return result as Record<string, unknown>;
}

export type UploadedImage = { url: string; publicId: string };

/** Uploads an image (already validated) to the property images folder; returns its HTTPS URL and public_id. */
export async function uploadPropertyImage(file: Blob): Promise<UploadedImage> {
  const result = await callUploadApi("upload", { folder: PROPERTY_IMAGES_FOLDER, transformation: UPLOAD_TRANSFORMATION }, file);
  if (typeof result.secure_url !== "string" || typeof result.public_id !== "string") {
    console.error("Unexpected Cloudinary upload response", result);
    throw new ApiError(502, "No fue posible guardar la imagen en Cloudinary. Inténtalo de nuevo.");
  }
  return { url: result.secure_url, publicId: result.public_id };
}

/** Deletes an image from Cloudinary (also invalidating cached copies). */
export async function destroyCloudinaryImage(publicId: string): Promise<void> {
  await callUploadApi("destroy", { public_id: publicId, invalidate: "true" });
}
