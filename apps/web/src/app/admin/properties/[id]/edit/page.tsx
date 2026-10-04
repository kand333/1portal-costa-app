import type { AdminPropertyDetail } from "@portal/shared/admin-property";
import { propertyIdSchema } from "@portal/shared/property-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPropertyEditor } from "@/components/admin/admin-property-editor";
import { AccessDenied } from "@/components/auth/access-denied";
import { findWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Editar propiedad | Administración | Portal Inmobiliario",
  robots: { index: false },
};

export default async function EditAdminPropertyPage({ params, searchParams }: PageProps<"/admin/properties/[id]/edit">) {
  const { id } = await params;
  // Checked here too: the layout check alone does not keep this content out of the response.
  if (!(await getAdminUser(`/admin/properties/${encodeURIComponent(id)}/edit`))) return <AccessDenied />;

  // An id that is not a UUID cannot exist: answer 404 without asking the API (which would answer 400).
  if (!propertyIdSchema.safeParse(id).success) notFound();
  const property = await findWithSession<AdminPropertyDetail>(`/api/admin/properties/${id}`);
  if (!property) notFound();
  // `?created=1`: the creation form redirects here.
  return <AdminPropertyEditor property={property} isNew={(await searchParams).created === "1"} />;
}
