import type { Metadata } from "next";
import { AccessDenied } from "@/components/auth/access-denied";
import { getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Administración | Portal Inmobiliario",
  robots: { index: false },
};

export default async function AdminPage() {
  // Checked here too: the layout check alone does not keep this content out of the response.
  if (!(await getAdminUser("/admin"))) return <AccessDenied />;

  return (
    <section aria-labelledby="admin-title" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 id="admin-title" className="font-display text-5xl font-semibold tracking-tight text-ink">
        Panel de administración
      </h1>
      <p className="mt-3 text-lg text-muted">
        Desde aquí administrarás propiedades, imágenes, características, usuarios y consultas.
      </p>
    </section>
  );
}
