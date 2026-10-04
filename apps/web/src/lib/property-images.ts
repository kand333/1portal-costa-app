import type { PropertyImageDetail } from "@portal/shared/property";
import {
  detectPropertyImageType,
  MAX_PROPERTY_IMAGE_BYTES,
  PROPERTY_IMAGE_FIELD,
  PROPERTY_IMAGE_MESSAGES,
} from "@portal/shared/property-image";
import { postForm, sendJson } from "./api-client";

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

/** Deletes an image of a property, from Cloudinary and PostgreSQL. */
export function deletePropertyImage(propertyId: string, imageId: string): Promise<void> {
  return sendJson<void>("DELETE", `/api/admin/properties/${propertyId}/images/${imageId}`);
}

/** Saves the order of the images (ids, first to last) and which one is the main one. */
export function arrangePropertyImages(propertyId: string, order: string[], mainImageId: string): Promise<PropertyImageDetail[]> {
  return sendJson<PropertyImageDetail[]>("PUT", `/api/admin/properties/${propertyId}/images`, { order, mainImageId });
}

/**
 * Moves an image one place left (-1) or right (+1) in the displayed order (main image first).
 * The main image stays first: it does not move and nothing moves before it.
 */
export function moveImage(order: string[], imageId: string, step: -1 | 1): string[] {
  const from = order.indexOf(imageId);
  const to = from + step;
  if (from <= 0 || to <= 0 || to >= order.length) return order;
  const next = [...order];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** Makes an image the main one: it goes first and the former main one right after it. */
export function makeMainImage(order: string[], imageId: string): string[] {
  if (!order.includes(imageId)) return order;
  return [imageId, ...order.filter((id) => id !== imageId)];
}
