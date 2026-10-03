import type { AdminPropertySummary } from "@portal/shared/admin-property";
import type { PaginatedResponse, PropertyFilterOptions } from "@portal/shared/property";
import type { Metadata } from "next";
import { AdminPropertyList } from "@/components/admin/admin-property-list";
import { AccessDenied } from "@/components/auth/access-denied";
import { buildAdminPropertiesApiPath, parseAdminPropertyListParams } from "@/lib/admin-properties";
import { fetchWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Propiedades | Administración | Portal Inmobiliario",
  robots: { index: false },
};

export default async function AdminPropertiesPage({ searchParams }: PageProps<"/admin/properties">) {
  // Checked here too: the layout check alone does not keep this content out of the response.
  if (!(await getAdminUser("/admin/properties"))) return <AccessDenied />;

  const params = parseAdminPropertyListParams(await searchParams);
  const [result, filterOptions] = await Promise.all([
    fetchWithSession<PaginatedResponse<AdminPropertySummary>>(buildAdminPropertiesApiPath(params)),
    // Cities of the published properties (the public catalog's list): new ones appear on their own.
    // Without it the city filter is hidden instead of breaking the page.
    fetchWithSession<PropertyFilterOptions>("/api/properties/filter-options").catch(() => null),
  ]);
  return <AdminPropertyList result={result} params={params} cities={filterOptions?.cities ?? []} />;
}
