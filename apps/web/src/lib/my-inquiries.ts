import type { UserInquiry } from "@portal/shared/inquiry";
import { sendJson } from "./api-client";

export const MY_INQUIRIES_PAGE_SIZE = 6;

/** Lowercase, without accents: «Ñuñoa» matches «nunoa». */
const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");

/** Title shown for an inquiry: the current one while published, otherwise the one saved when it was sent. */
export const inquiryTitle = (inquiry: UserInquiry) => inquiry.property?.title ?? inquiry.propertyTitle;

/** Inquiries whose property title or message contain every word of the search (ignoring case and accents). */
export function filterInquiries(inquiries: UserInquiry[], search: string): UserInquiry[] {
  const words = normalize(search).split(/\s+/).filter(Boolean);
  if (words.length === 0) return inquiries;
  return inquiries.filter((inquiry) => {
    const text = normalize(`${inquiryTitle(inquiry)} ${inquiry.propertyTitle} ${inquiry.message}`);
    return words.every((word) => text.includes(word));
  });
}

/** One page of the list; a page beyond the last one shows the last one. */
export function paginateInquiries(inquiries: UserInquiry[], page: number) {
  const totalPages = Math.max(1, Math.ceil(inquiries.length / MY_INQUIRIES_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * MY_INQUIRIES_PAGE_SIZE;
  return { items: inquiries.slice(start, start + MY_INQUIRIES_PAGE_SIZE), currentPage, totalPages };
}

/** Removes an inquiry from the user's account (ADMIN keeps it). */
export function removeMyInquiry(inquiryId: string): Promise<void> {
  return sendJson<void>("DELETE", `/api/account/inquiries/${inquiryId}`);
}
