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
    <form action={pathname} method="get" role="search" aria-label="Buscar en el catálogo" onSubmit={handleSubmit} className="mb-6 flex flex-wrap gap-3">
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
          className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>
      <button
        type="submit"
        className="h-11 rounded-lg bg-sky-700 px-5 font-semibold text-white hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
      >
        Buscar
      </button>
      {search && (
        <Link
          href={buildCatalogSearchHref(pathname, new URLSearchParams(searchParams.toString()), "")}
          className="inline-flex h-11 items-center rounded-lg px-3 text-sm font-semibold text-sky-700 hover:text-sky-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:text-sky-400"
        >
          Limpiar búsqueda
        </Link>
      )}
    </form>
  );
}
