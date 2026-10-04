import "server-only";
import { destroyCloudinaryImage, uploadPropertyImage } from "@/lib/cloudinary";
import { ApiError } from "@/lib/http/api-error";
import { insertUploadedImage, propertyAcceptsImages } from "@/repositories/property-image-repository";
import {
  detectPropertyImageType,
  MAX_PROPERTY_IMAGE_BYTES,
  PROPERTY_IMAGE_MESSAGES,
} from "@portal/shared/property-image";
import type { PropertyImageDetail } from "@portal/shared/property";

/**
 * Validates an image (size, and type by its bytes), uploads it to Cloudinary and stores its URL and
 * publicId. If storing fails, the uploaded asset is destroyed so Cloudinary and PostgreSQL stay in sync.
 */
export async function addPropertyImage(propertyId: string, file: Blob): Promise<PropertyImageDetail> {
  if (file.size === 0) throw new ApiError(400, PROPERTY_IMAGE_MESSAGES.empty);
  if (file.size > MAX_PROPERTY_IMAGE_BYTES) throw new ApiError(413, PROPERTY_IMAGE_MESSAGES.tooLarge);
  const type = detectPropertyImageType(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
  if (!type) throw new ApiError(415, PROPERTY_IMAGE_MESSAGES.invalidType);

  // Checked before uploading, so nothing reaches Cloudinary for a missing or deleted property.
  if (!(await propertyAcceptsImages(propertyId))) throw new ApiError(404, "Propiedad no encontrada");

  const uploaded = await uploadPropertyImage(new Blob([await file.arrayBuffer()], { type }));
  try {
    return await insertUploadedImage(propertyId, uploaded);
  } catch (error) {
    await destroyCloudinaryImage(uploaded.publicId).catch((destroyError: unknown) => {
      console.error(`Could not remove the orphan Cloudinary image ${uploaded.publicId}`, destroyError);
    });
    throw error;
  }
}
