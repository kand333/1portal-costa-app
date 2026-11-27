"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { buildCatalogSearchHref } from "@/lib/property-search";

type CatalogSearchChipProps = {
  /** Current search, taken from the URL (e.g. the commune chosen on the home page). */
  search: string | undefined;
};

/** There is no free-text field: a search only arrives through the URL (`?search=`). This chip shows it and lets people remove it. */
export function CatalogSearchChip({ search }: CatalogSearchChipProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!search) return null;

  return (
    <p className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted">
      <span>
        Búsqueda: <strong className="font-semibold text-brass-text">{search}</strong>
      </span>
      <Link
        href={buildCatalogSearchHref(pathname, new URLSearchParams(searchParams.toString()), "")}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-ink underline decoration-brass decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
      >
        Quitar búsqueda
      </Link>
    </p>
  );
}
