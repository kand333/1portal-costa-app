import type { Metadata } from "next";
import { AdminPropertyEditor } from "@/components/admin/admin-property-editor";
import { AccessDenied } from "@/components/auth/access-denied";
import { getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Nueva propiedad | Administración | Portal Inmobiliario",
  robots: { index: false },
};

export default async function NewAdminPropertyPage() {
  // Checked here too: the layout check alone does not keep this content out of the response.
  if (!(await getAdminUser("/admin/properties/new"))) return <AccessDenied />;
  return <AdminPropertyEditor property={null} />;
}
