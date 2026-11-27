import type { ValuationCityDto } from "@portal/shared/valuation-sector";
import type { Metadata } from "next";
import { AdminValuationSectors } from "@/components/admin/admin-valuation-sectors";
import { AccessDenied } from "@/components/auth/access-denied";
import { fetchWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Tasación por sector | Administración | PropiZoom",
  robots: { index: false },
};

export default async function AdminValuationSectorsPage() {
  // Checked here too: the layout check alone does not keep this content out of the response.
  if (!(await getAdminUser("/admin/valuation-sectors"))) return <AccessDenied />;
  const cities = await fetchWithSession<ValuationCityDto[]>("/api/admin/valuation-sectors");
  return <AdminValuationSectors cities={cities} />;
}
