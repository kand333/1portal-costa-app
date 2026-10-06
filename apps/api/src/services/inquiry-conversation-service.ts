import "server-only";
import { ApiError } from "@/lib/http/api-error";
import {
  findAdminInquiries,
  findAdminInquiryById,
  inquiryExists,
  type AdminInquiryRecord,
} from "@/repositories/admin-inquiry-repository";
import { findUserInquiryWithMessages, insertInquiryMessage, inquiryMessageSelect } from "@/repositories/inquiry-repository";
import { toLastMessage, toUserInquiry } from "@/services/inquiry-service";
import type { AuthUser } from "@portal/shared/auth";
import type {
  AdminInquiryDetail,
  AdminInquiryListQuery,
  AdminInquirySummary,
  InquiryMessage,
  InquiryReplyData,
  UserInquiryDetail,
} from "@portal/shared/inquiry";
import type { PaginatedResponse } from "@portal/shared/property";
import type { Prisma } from "@/generated/prisma/client";

const NOT_FOUND = "Consulta no encontrada";

type InquiryMessageRecord = Prisma.InquiryMessageGetPayload<{ select: typeof inquiryMessageSelect }>;

const toInquiryMessage = (record: InquiryMessageRecord): InquiryMessage => ({
  id: record.id,
  fromAdmin: record.fromAdmin,
  authorName: record.author?.name ?? null,
  body: record.body,
  createdAt: record.createdAt.toISOString(),
});

function toAdminSummary(record: AdminInquiryRecord): AdminInquirySummary {
  const [lastMessage] = record.messages;
  return {
    id: record.id,
    propertyId: record.propertyId,
    propertyTitle: record.propertyTitle,
    isPropertyPublic: Boolean(record.property?.isPublished && !record.property.deletedAt),
    user: record.user,
    name: record.name,
    email: record.email,
    phone: record.phone,
    message: record.message,
    createdAt: record.createdAt.toISOString(),
    hiddenByUser: record.hiddenByUser,
    messageCount: record._count.messages,
    lastActivityAt: record.lastActivityAt.toISOString(),
    lastMessage: toLastMessage(lastMessage),
    // The inquiry itself is the user's word: it waits until the latest message is from ADMIN.
    awaitingReply: !lastMessage?.fromAdmin,
  };
}

/** Free-text terms, as typed (the inquiry columns keep accents; the search ignores case only). */
const splitTerms = (search: string | undefined) => (search ?? "").trim().split(/\s+/).filter(Boolean);

export async function listAdminInquiries(query: AdminInquiryListQuery): Promise<PaginatedResponse<AdminInquirySummary>> {
  const { page, pageSize, search } = query;
  const { records, total } = await findAdminInquiries(splitTerms(search), { skip: (page - 1) * pageSize, take: pageSize });
  return {
    data: records.map(toAdminSummary),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getAdminInquiry(id: string): Promise<AdminInquiryDetail> {
  const found = await findAdminInquiryById(id);
  if (!found) throw new ApiError(404, NOT_FOUND);
  return { ...toAdminSummary(found.record), messages: found.messages.map(toInquiryMessage) };
}

/** ADMIN answers an inquiry. A registered user sees it in their account and can answer back. */
export async function replyAsAdmin(admin: AuthUser, inquiryId: string, data: InquiryReplyData): Promise<InquiryMessage> {
  if (!(await inquiryExists(inquiryId))) throw new ApiError(404, NOT_FOUND);
  const { messages } = await insertInquiryMessage({ inquiryId, authorId: admin.id, fromAdmin: true, body: data.body });
  return toInquiryMessage(messages[0]);
}

/** One of the user's inquiries with its conversation; 404 when it is not theirs or they removed it. */
export async function getUserInquiry(user: AuthUser, inquiryId: string): Promise<UserInquiryDetail> {
  const record = await findUserInquiryWithMessages(user.id, inquiryId);
  if (!record) throw new ApiError(404, NOT_FOUND);
  const { messages, ...inquiry } = record;
  return { ...toUserInquiry({ ...inquiry, messages: messages.slice(-1) }), messages: messages.map(toInquiryMessage) };
}

/** The user answers in the conversation of one of their inquiries. */
export async function replyAsUser(user: AuthUser, inquiryId: string, data: InquiryReplyData): Promise<InquiryMessage> {
  if (!(await findUserInquiryWithMessages(user.id, inquiryId))) throw new ApiError(404, NOT_FOUND);
  const { messages } = await insertInquiryMessage({ inquiryId, authorId: user.id, fromAdmin: false, body: data.body });
  return toInquiryMessage(messages[0]);
}
