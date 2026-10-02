import "server-only";
import { ApiError } from "@/lib/http/api-error";
import { insertInquiry } from "@/repositories/inquiry-repository";
import { findPublishedPropertyById } from "@/repositories/property-repository";
import type { InquiryCreateData, InquiryCreated } from "@portal/shared/inquiry";

/**
 * Stores an inquiry about a published property. It is saved before any email is sent (the browser
 * sends it through Web3Forms afterwards), so an email failure never loses the inquiry.
 * The title is copied so the inquiry keeps it even if the property changes or is deleted.
 */
export async function createInquiry(data: InquiryCreateData): Promise<InquiryCreated> {
  const property = await findPublishedPropertyById(data.propertyId);
  if (!property) {
    throw new ApiError(404, "Propiedad no encontrada");
  }

  const inquiry = await insertInquiry({
    propertyId: property.id,
    propertyTitle: property.title,
    // Visitors only for now: linking the authenticated user is task 21.
    userId: null,
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    message: data.message,
  });

  return {
    id: inquiry.id,
    propertyId: property.id,
    propertyTitle: inquiry.propertyTitle,
    createdAt: inquiry.createdAt.toISOString(),
  };
}
