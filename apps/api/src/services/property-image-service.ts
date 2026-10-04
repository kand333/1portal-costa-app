import "server-only";
import { destroyCloudinaryImage, uploadPropertyImage } from "@/lib/cloudinary";
import { ApiError } from "@/lib/http/api-error";
import { isSeedPlaceholder } from "@/lib/seed-placeholder";
import {
  arrangeImages,
  countRealImages,
  deleteImageRow,
  findManagedPropertyImages,
  insertUploadedImage,
} from "@/repositories/property-image-repository";
import type { PropertyImageDetail } from "@portal/shared/property";
import {
  detectPropertyImageType,
  MAX_PROPERTY_IMAGE_BYTES,
  MAX_PROPERTY_IMAGES,
  PROPERTY_IMAGE_MESSAGES,
  type PropertyImageArrangement,
} from "@portal/shared/property-image";

const PROPERTY_NOT_FOUND = "Propiedad no encontrada";
const IMAGE_NOT_FOUND = "Imagen no encontrada";

/** The property's images, or 404 when it does not exist or was deleted. */
async function getManagedImages(propertyId: string) {
  const images = await findManagedPropertyImages(propertyId);
  if (!images) throw new ApiError(404, PROPERTY_NOT_FOUND);
  return images;
}

/**
 * Validates an image (size, and type by its bytes), uploads it to Cloudinary and stores its URL and
 * publicId. If storing fails, the uploaded asset is destroyed so Cloudinary and PostgreSQL stay in sync.
 */
export async function addPropertyImage(propertyId: string, file: Blob): Promise<PropertyImageDetail> {
  if (file.size === 0) throw new ApiError(400, PROPERTY_IMAGE_MESSAGES.empty);
  if (file.size > MAX_PROPERTY_IMAGE_BYTES) throw new ApiError(413, PROPERTY_IMAGE_MESSAGES.tooLarge);
  const type = detectPropertyImageType(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
  if (!type) throw new ApiError(415, PROPERTY_IMAGE_MESSAGES.invalidType);

  // Checked before uploading, so nothing reaches Cloudinary for a missing property or a full gallery.
  await getManagedImages(propertyId);
  if ((await countRealImages(propertyId)) >= MAX_PROPERTY_IMAGES) throw new ApiError(409, PROPERTY_IMAGE_MESSAGES.tooMany);

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

/**
 * Deletes an image: first from Cloudinary, then its row. If Cloudinary fails nothing changes (the
 * request can be retried), so PostgreSQL never points to a destroyed asset. The seed placeholders
 * are not in our Cloudinary account: only their row is removed.
 */
export async function removePropertyImage(propertyId: string, imageId: string): Promise<void> {
  const image = (await getManagedImages(propertyId)).find((candidate) => candidate.id === imageId);
  if (!image) throw new ApiError(404, IMAGE_NOT_FOUND);
  if (!isSeedPlaceholder(image.publicId)) await destroyCloudinaryImage(image.publicId);
  await deleteImageRow(propertyId, imageId);
}

/** Sets the order and the main image; the order must list exactly the property's images. */
export async function arrangePropertyImages(
  propertyId: string,
  { order, mainImageId }: PropertyImageArrangement,
): Promise<PropertyImageDetail[]> {
  const images = await getManagedImages(propertyId);
  const stored = new Set(images.map((image) => image.id));
  if (order.length !== stored.size || !order.every((id) => stored.has(id))) {
    throw new ApiError(409, "Las imágenes cambiaron: recarga la página e inténtalo de nuevo");
  }
  return arrangeImages(propertyId, order, mainImageId);
}
