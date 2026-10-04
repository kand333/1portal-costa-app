import type { AdminFeature } from "@portal/shared/feature";
import type { Metadata } from "next";
import { AdminPropertyEditor } from "@/components/admin/admin-property-editor";
import { AccessDenied } from "@/components/auth/access-denied";
import { fetchWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Nueva propiedad | Administración | Portal Inmobiliario",
  robots: { index: false },
};

export default async function NewAdminPropertyPage() {
  // Checked here too: the layout check alone does not keep this content out of the response.
  if (!(await getAdminUser("/admin/properties/new"))) return <AccessDenied />;
  // Without the catalog the form still offers the common features.
  const catalog = await fetchWithSession<AdminFeature[]>("/api/admin/features").catch(() => []);
  return <AdminPropertyEditor property={null} catalog={catalog.map((feature) => feature.name)} />;
}
