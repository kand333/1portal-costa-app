import type { AdminFeature } from "@portal/shared/feature";
import type { Metadata } from "next";
import { AdminFeatureCatalog } from "@/components/admin/admin-feature-catalog";
import { AccessDenied } from "@/components/auth/access-denied";
import { fetchWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Características | Administración | Portal Inmobiliario",
  robots: { index: false },
};

export default async function AdminFeaturesPage() {
  // Checked here too: the layout check alone does not keep this content out of the response.
  if (!(await getAdminUser("/admin/properties/features"))) return <AccessDenied />;
  const features = await fetchWithSession<AdminFeature[]>("/api/admin/features");
  return <AdminFeatureCatalog features={features} />;
}
