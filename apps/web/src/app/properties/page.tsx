import type { Metadata } from "next";
import { Suspense } from "react";
import { PropertyCatalog } from "@/components/properties/property-catalog";
import { PropertyGridSkeleton } from "@/components/properties/property-grid";

export const metadata: Metadata = {
  title: "Propiedades | Portal Inmobiliario",
  description: "Casas, departamentos, oficinas y terrenos en venta y arriendo en Chile.",
};

export default function PropertiesPage() {
  return (
    <section aria-labelledby="catalog-title" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 id="catalog-title" className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Propiedades
      </h1>
      <p className="mt-2 mb-6 text-zinc-600 dark:text-zinc-400">
        Explora las propiedades publicadas en venta y arriendo.
      </p>
      {/* useSearchParams needs a Suspense boundary so the rest of the page can be prerendered. */}
      <Suspense fallback={<PropertyGridSkeleton count={12} label="Cargando propiedades" layout="withSidebar" />}>
        <PropertyCatalog />
      </Suspense>
    </section>
  );
}
