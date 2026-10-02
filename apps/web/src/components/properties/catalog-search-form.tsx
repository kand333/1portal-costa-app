"use client";

import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { buildCatalogSearchHref } from "@/lib/property-search";

type CatalogSearchFormProps = {
  /** Current search, taken from the URL. */
  search: string | undefined;
};

/** Text search of the catalog. The search lives in the URL (`?search=`), so it can be shared and survives reloads. */
export function CatalogSearchForm({ search }: CatalogSearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [text, setText] = useState(search ?? "");
  const [syncedSearch, setSyncedSearch] = useState(search);

  // Follow the URL (e.g. browser back/forward, or clearing the search) without re-mounting the
  // field, which would make it lose the keyboard focus. Adjusting state while rendering is the
  // pattern React recommends instead of an effect.
  if (search !== syncedSearch) {
    setSyncedSearch(search);
    setText(search ?? "");
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setText(event.target.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(buildCatalogSearchHref(pathname, new URLSearchParams(searchParams.toString()), text));
  }

  return (
    <form action={pathname} method="get" role="search" aria-label="Buscar en el catálogo" onSubmit={handleSubmit} className="mb-8 flex flex-wrap gap-3">
      <div className="min-w-0 flex-1 basis-64">
        <label htmlFor="catalog-search" className="sr-only">
          Buscar por título, comuna, ciudad, región o descripción
        </label>
        <input
          id="catalog-search"
          name="search"
          type="search"
          value={text}
          onChange={handleChange}
          maxLength={MAX_SEARCH_LENGTH}
          placeholder="Busca por comuna, ciudad o palabra clave"
          className="h-12 w-full rounded-full border border-line bg-surface px-5 text-ink shadow-soft transition-colors duration-200 hover:border-brass/60 focus-visible:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40"
        />
      </div>
      <button
        type="submit"
        className="h-12 rounded-full bg-accent px-7 font-semibold text-on-accent transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-accent-hover active:translate-y-0"
      >
        Buscar
      </button>
      {search && (
        <Link
          href={buildCatalogSearchHref(pathname, new URLSearchParams(searchParams.toString()), "")}
          className="inline-flex h-12 items-center px-2 text-sm font-semibold text-ink underline decoration-brass decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
        >
          Limpiar búsqueda
        </Link>
      )}
    </form>
  );
}
