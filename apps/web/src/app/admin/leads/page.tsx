import type { AdminLeadSummary } from "@portal/shared/lead";
import type { PaginatedResponse } from "@portal/shared/property";
import type { Metadata } from "next";
import { AdminLeadList } from "@/components/admin/admin-lead-list";
import { AccessDenied } from "@/components/auth/access-denied";
import { parsePageParam } from "@/lib/pagination";
import { fetchWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Leads | Administración | PropiZoom",
  robots: { index: false },
};

export default async function AdminLeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  // Checked here too: the layout check alone does not keep this content out of the response.
  if (!(await getAdminUser("/admin/leads"))) return <AccessDenied />;

  const { page: pageParam } = await searchParams;
  const page = parsePageParam(Array.isArray(pageParam) ? pageParam[0] : (pageParam ?? null));
  const result = await fetchWithSession<PaginatedResponse<AdminLeadSummary>>(`/api/admin/leads${page > 1 ? `?page=${page}` : ""}`);
  return <AdminLeadList result={result} page={page} />;
}
