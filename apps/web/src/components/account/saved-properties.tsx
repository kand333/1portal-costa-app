"use client";

import Link from "next/link";
import { PropertyResults } from "@/components/properties/property-results";
import { useFavorites } from "@/hooks/use-favorites";

/** Saved properties of the account page. Removing one from a card updates the list right away. */
export function SavedProperties() {
  const { data: favorites, error, isLoading, mutate } = useFavorites();

  if (favorites && favorites.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-line p-8 text-center">
        <p className="text-muted">Aún no tienes propiedades guardadas.</p>
        <Link
          href="/properties"
          className="mt-4 inline-flex border-b border-brass pb-0.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink"
        >
          Explorar propiedades
        </Link>
      </div>
    );
  }

  return (
    <PropertyResults
      data={favorites ? { data: favorites, meta: { page: 1, pageSize: favorites.length, total: favorites.length, totalPages: 1 } } : undefined}
      error={error}
      isLoading={isLoading || favorites === undefined}
      onRetry={() => mutate()}
      skeletonCount={2}
      loadingLabel="Cargando tus propiedades guardadas"
      emptyMessage="Aún no tienes propiedades guardadas."
      layout="withSidebar"
    />
  );
}
