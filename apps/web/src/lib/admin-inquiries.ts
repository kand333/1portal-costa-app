import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import { parsePageParam } from "./pagination";

export const ADMIN_INQUIRIES_PATH = "/admin/inquiries";

export type AdminInquiryListParams = { page: number; search: string };

type PageSearchParams = Record<string, string | string[] | undefined>;

const firstValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Reads `page` and `search` from the URL; invalid values fall back to page 1 and no search. */
export function parseAdminInquiryListParams(searchParams: PageSearchParams): AdminInquiryListParams {
  return {
    page: parsePageParam(firstValue(searchParams.page) ?? null),
    search: (firstValue(searchParams.search) ?? "").trim().slice(0, MAX_SEARCH_LENGTH),
  };
}

/** The same parameters as a query string, without the defaults (page URL and API call). */
export function toAdminInquiryListQuery({ page, search }: AdminInquiryListParams): URLSearchParams {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (page > 1) query.set("page", String(page));
  return query;
}

export function buildAdminInquiriesApiPath(params: AdminInquiryListParams): string {
  const query = toAdminInquiryListQuery(params).toString();
  return query ? `/api/admin/inquiries?${query}` : "/api/admin/inquiries";
}

/** «Responder por email» for visitors, who have no account to read the answer in. */
export function buildReplyMailto(inquiry: { email: string; propertyTitle: string }): string {
  return `mailto:${inquiry.email}?${new URLSearchParams({ subject: `Tu consulta sobre «${inquiry.propertyTitle}»` })}`
    .replaceAll("+", "%20");
}
