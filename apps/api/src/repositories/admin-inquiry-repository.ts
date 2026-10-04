import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { escapeLikePattern } from "@/lib/escape-like";
import { prisma } from "@/lib/prisma";
import { inquiryMessageSelect } from "@/repositories/inquiry-repository";

const adminInquirySelect = {
  id: true,
  propertyId: true,
  propertyTitle: true,
  name: true,
  email: true,
  phone: true,
  message: true,
  createdAt: true,
  hiddenByUser: true,
  property: { select: { isPublished: true, deletedAt: true } },
  user: { select: { id: true, name: true, email: true } },
  _count: { select: { messages: true } },
  // The latest message tells whether the inquiry is waiting for an answer.
  messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1, select: { fromAdmin: true, createdAt: true } },
} satisfies Prisma.InquirySelect;

export type AdminInquiryRecord = Prisma.InquiryGetPayload<{ select: typeof adminInquirySelect }>;

/** Every inquiry (also the ones a user removed from their account), newest first. */
export async function findAdminInquiries(
  searchTerms: string[],
  pagination: { skip: number; take: number },
): Promise<{ records: AdminInquiryRecord[]; total: number }> {
  // Each term must appear (ignoring case) in the property title, the name, the email or the message.
  const where: Prisma.InquiryWhereInput = {
    AND: searchTerms.map((term) => {
      const contains = { contains: escapeLikePattern(term), mode: "insensitive" as const };
      return { OR: [{ propertyTitle: contains }, { name: contains }, { email: contains }, { message: contains }] };
    }),
  };
  const [records, total] = await prisma.$transaction([
    prisma.inquiry.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pagination.skip,
      take: pagination.take,
      select: adminInquirySelect,
    }),
    prisma.inquiry.count({ where }),
  ]);
  return { records, total };
}

/** An inquiry with its whole conversation, oldest message first, or null. */
export async function findAdminInquiryById(id: string) {
  const [record, messages] = await prisma.$transaction([
    prisma.inquiry.findUnique({ where: { id }, select: adminInquirySelect }),
    prisma.inquiryMessage.findMany({
      where: { inquiryId: id },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: inquiryMessageSelect,
    }),
  ]);
  return record ? { record, messages } : null;
}

export function inquiryExists(id: string): Promise<boolean> {
  return prisma.inquiry.count({ where: { id } }).then((count) => count > 0);
}
