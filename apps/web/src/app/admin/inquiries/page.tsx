import type { AdminInquirySummary } from "@portal/shared/inquiry";
import type { PaginatedResponse } from "@portal/shared/property";
import type { Metadata } from "next";
import { AdminInquiryList } from "@/components/admin/admin-inquiry-list";
import { AccessDenied } from "@/components/auth/access-denied";
import { buildAdminInquiriesApiPath, parseAdminInquiryListParams } from "@/lib/admin-inquiries";
import { fetchWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Consultas | Administración | Portal Inmobiliario",
  robots: { index: false },
};

export default async function AdminInquiriesPage({ searchParams }: PageProps<"/admin/inquiries">) {
  // Checked here too: the layout check alone does not keep this content out of the response.
  if (!(await getAdminUser("/admin/inquiries"))) return <AccessDenied />;

  const params = parseAdminInquiryListParams(await searchParams);
  const result = await fetchWithSession<PaginatedResponse<AdminInquirySummary>>(buildAdminInquiriesApiPath(params));
  return <AdminInquiryList result={result} params={params} />;
}
