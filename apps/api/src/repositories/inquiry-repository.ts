import "server-only";
import { prisma } from "@/lib/prisma";
import { propertySummarySelect } from "@/repositories/property-repository";

export type NewInquiry = {
  propertyId: string;
  propertyTitle: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
};

const inquiryCreatedSelect = {
  id: true,
  propertyId: true,
  propertyTitle: true,
  createdAt: true,
} as const;

export function insertInquiry(data: NewInquiry) {
  return prisma.inquiry.create({ data, select: inquiryCreatedSelect });
}

/** A message of the conversation that follows an inquiry, oldest first. */
export const inquiryMessageSelect = {
  id: true,
  fromAdmin: true,
  body: true,
  createdAt: true,
  author: { select: { name: true } },
} as const;

const userInquirySelect = {
  id: true,
  propertyId: true,
  propertyTitle: true,
  message: true,
  createdAt: true,
  property: { select: { ...propertySummarySelect, isPublished: true, deletedAt: true } },
  _count: { select: { messages: { where: { fromAdmin: true } } } },
} as const;

/** The user's inquiries, except the ones they removed from their account. */
export function findUserInquiries(userId: string) {
  return prisma.inquiry.findMany({
    where: { userId, hiddenByUser: false },
    orderBy: { createdAt: "desc" },
    select: userInquirySelect,
  });
}

/** One of the user's inquiries (not removed from their account) with its conversation, or null. */
export function findUserInquiryWithMessages(userId: string, inquiryId: string) {
  return prisma.inquiry.findFirst({
    where: { id: inquiryId, userId, hiddenByUser: false },
    select: { ...userInquirySelect, messages: { orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: inquiryMessageSelect } },
  });
}

/** Adds a reply to the conversation of an inquiry. */
export function insertInquiryMessage(data: { inquiryId: string; authorId: string; fromAdmin: boolean; body: string }) {
  return prisma.inquiry.update({
    where: { id: data.inquiryId },
    data: { messages: { create: { authorId: data.authorId, fromAdmin: data.fromAdmin, body: data.body } } },
    select: { messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1, select: inquiryMessageSelect } },
  });
}

/** Hides one of the user's inquiries from their account (ADMIN keeps it). Returns false when it is not theirs or already hidden. */
export async function hideUserInquiry(userId: string, inquiryId: string): Promise<boolean> {
  const { count } = await prisma.inquiry.updateMany({
    where: { id: inquiryId, userId, hiddenByUser: false },
    data: { hiddenByUser: true },
  });
  return count > 0;
}
