import type { AdminFeature } from "@portal/shared/feature";
import type { AdminPropertyDetail } from "@portal/shared/admin-property";
import { propertyIdSchema } from "@portal/shared/property-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPropertyEditor } from "@/components/admin/admin-property-editor";
import { AccessDenied } from "@/components/auth/access-denied";
import { fetchWithSession, findWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Editar propiedad | Administración | Portal Inmobiliario",
  robots: { index: false },
};

export default async function EditAdminPropertyPage({ params }: PageProps<"/admin/properties/[id]/edit">) {
  const { id } = await params;
  // Checked here too: the layout check alone does not keep this content out of the response.
  if (!(await getAdminUser(`/admin/properties/${encodeURIComponent(id)}/edit`))) return <AccessDenied />;

  // An id that is not a UUID cannot exist: answer 404 without asking the API (which would answer 400).
  if (!propertyIdSchema.safeParse(id).success) notFound();
  const [property, catalog] = await Promise.all([
    findWithSession<AdminPropertyDetail>(`/api/admin/properties/${id}`),
    // Without the catalog the form still offers the common features and the property's own.
    fetchWithSession<AdminFeature[]>("/api/admin/features").catch(() => []),
  ]);
  if (!property) notFound();
  return <AdminPropertyEditor property={property} catalog={catalog.map((feature) => feature.name)} />;
}
