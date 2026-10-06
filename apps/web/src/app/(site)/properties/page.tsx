import type { Metadata } from "next";
import { Suspense } from "react";
import { PropertyCatalog } from "@/components/properties/property-catalog";
import { PropertyGridSkeleton } from "@/components/properties/property-grid";
import { SITE_NAME } from "@/lib/property-metadata";

const title = `Propiedades | ${SITE_NAME}`;
const description = "Casas, departamentos, oficinas y terrenos en venta y arriendo en Chile.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/properties" },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "es_CL", url: "/properties", title, description },
};

export default function PropertiesPage() {
  return (
    <section aria-labelledby="catalog-title" className="mx-auto w-full max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <h1 id="catalog-title" className="font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
        Propiedades
      </h1>
      <p className="mt-3 mb-10 max-w-xl text-lg text-muted">
        Explora las propiedades publicadas en venta y arriendo.
      </p>
      {/* useSearchParams needs a Suspense boundary so the rest of the page can be prerendered. */}
      <Suspense fallback={<PropertyGridSkeleton count={12} label="Cargando propiedades" layout="withSidebar" />}>
        <PropertyCatalog />
      </Suspense>
    </section>
  );
}
