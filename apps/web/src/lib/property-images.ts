import type { PropertyImageDetail } from "@portal/shared/property";
import {
  detectPropertyImageType,
  MAX_PROPERTY_IMAGE_BYTES,
  PROPERTY_IMAGE_FIELD,
  PROPERTY_IMAGE_MESSAGES,
} from "@portal/shared/property-image";
import { postForm } from "./api-client";

/** Same checks as the API (size, type by its bytes), to answer at once; the API checks again. */
export async function validatePropertyImageFile(file: Blob): Promise<string | null> {
  if (file.size === 0) return PROPERTY_IMAGE_MESSAGES.empty;
  if (file.size > MAX_PROPERTY_IMAGE_BYTES) return PROPERTY_IMAGE_MESSAGES.tooLarge;
  const type = detectPropertyImageType(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
  return type ? null : PROPERTY_IMAGE_MESSAGES.invalidType;
}

/** Uploads an image of a property (ADMIN): the API stores it in Cloudinary and PostgreSQL. */
export function uploadPropertyImage(propertyId: string, file: File): Promise<PropertyImageDetail> {
  const form = new FormData();
  form.set(PROPERTY_IMAGE_FIELD, file);
  return postForm<PropertyImageDetail>(`/api/admin/properties/${propertyId}/images`, form);
}
