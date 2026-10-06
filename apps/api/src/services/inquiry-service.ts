import "server-only";
import { ApiError } from "@/lib/http/api-error";
import { findUserInquiries, hideUserInquiry, insertInquiry } from "@/repositories/inquiry-repository";
import { toPropertySummary } from "@/services/property-service";
import { findPublishedPropertyById } from "@/repositories/property-repository";
import type { AuthUser } from "@portal/shared/auth";
import type { InquiryCreateData, InquiryCreated, InquiryLastMessage, UserInquiry } from "@portal/shared/inquiry";

/**
 * Stores an inquiry about a published property. It is saved before any email is sent (the browser
 * sends it through Web3Forms afterwards), so an email failure never loses the inquiry.
 * The title is copied so the inquiry keeps it even if the property changes or is deleted.
 */
export async function createInquiry(data: InquiryCreateData, user: AuthUser | null = null): Promise<InquiryCreated> {
  const property = await findPublishedPropertyById(data.propertyId);
  if (!property) {
    throw new ApiError(404, "Propiedad no encontrada");
  }

  const inquiry = await insertInquiry({
    propertyId: property.id,
    propertyTitle: property.title,
    // Linked to the account when there is a session, so the user can see it in /account.
    userId: user?.id ?? null,
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

type UserInquiryRecord = Awaited<ReturnType<typeof findUserInquiries>>[number];

/** The property is null once it is unpublished or deleted. */
export const toLastMessage = (message: { fromAdmin: boolean; body: string; createdAt: Date } | undefined): InquiryLastMessage | null =>
  message ? { fromAdmin: message.fromAdmin, body: message.body, createdAt: message.createdAt.toISOString() } : null;

export function toUserInquiry({ property, _count, messages, ...inquiry }: UserInquiryRecord): UserInquiry {
  return {
    id: inquiry.id,
    propertyId: inquiry.propertyId,
    propertyTitle: inquiry.propertyTitle,
    message: inquiry.message,
    createdAt: inquiry.createdAt.toISOString(),
    property: property?.isPublished && !property.deletedAt ? toPropertySummary(property) : null,
    adminReplyCount: _count.messages,
    lastActivityAt: inquiry.lastActivityAt.toISOString(),
    lastMessage: toLastMessage(messages[0]),
  };
}

/** Inquiries sent by the user, latest activity first. */
export async function listUserInquiries(user: AuthUser): Promise<UserInquiry[]> {
  return (await findUserInquiries(user.id)).map(toUserInquiry);
}

/** Removes an inquiry from the user's account; it stays stored for ADMIN. 404 when it is not theirs. */
export async function removeUserInquiry(user: AuthUser, inquiryId: string): Promise<void> {
  if (!(await hideUserInquiry(user.id, inquiryId))) throw new ApiError(404, "Consulta no encontrada");
}
