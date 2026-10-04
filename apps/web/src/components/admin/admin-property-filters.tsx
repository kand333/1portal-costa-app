"use client";

import { OPERATION_TYPES, PROPERTY_TYPES } from "@portal/shared/enums";
import type { LocationOption } from "@portal/shared/property";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type SyntheticEvent } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  ADMIN_PROPERTIES_PATH,
  countActiveFilters,
  parseAdminPropertyListParams,
  toAdminPropertyListQuery,
  type AdminPropertyListParams,
} from "@/lib/admin-properties";
import { operationLabels, propertyTypeLabels } from "@/lib/property-format";

const statusOptions = [
  { value: "", label: "Activas (todas)" },
  { value: "published", label: "Publicadas" },
  { value: "draft", label: "Borradores" },
  { value: "deleted", label: "Eliminadas" },
] as const;

const labelClassName = "mb-1.5 block text-sm font-medium text-ink";
const controlClassName =
  "h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink transition-colors duration-200 hover:border-brass/60 focus-visible:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40";

type AdminPropertyFiltersProps = {
  params: AdminPropertyListParams;
  /** Cities with published properties; the filter is hidden when there are none. */
  cities: LocationOption[];
};

const hrefFor = (params: AdminPropertyListParams) => {
  const query = toAdminPropertyListQuery(params).toString();
  return query ? `${ADMIN_PROPERTIES_PATH}?${query}` : ADMIN_PROPERTIES_PATH;
};

/**
 * Collapsible filter panel of the admin property list. Filters combine (AND) and live in the URL,
 * so the list is server-rendered and can be shared. Without JavaScript the GET form still works.
 */
export function AdminPropertyFilters({ params, cities }: AdminPropertyFiltersProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const activeCount = countActiveFilters(params);
  // Open by default when it fits beside the list (xl) or filters are in use; after that, the user decides.
  const isWide = useMediaQuery("(min-width: 1280px)");
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const isOpen = userOpen ?? (isWide || activeCount > 0);

  function handleToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    setUserOpen(event.currentTarget.open);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;

    // Ranges are checked here so the message shows next to the fields (the API would reject them).
    const minPrice = form.minPrice ? Number(form.minPrice) : undefined;
    const maxPrice = form.maxPrice ? Number(form.maxPrice) : undefined;
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      setError("El precio mínimo no puede ser mayor que el máximo.");
      return;
    }
    if (form.createdFrom && form.createdTo && form.createdFrom > form.createdTo) {
      setError("La fecha «desde» no puede ser posterior a «hasta».");
      return;
    }
    setError(null);
    // Back to page 1: the current page may not exist with the new filters.
    router.push(hrefFor({ ...parseAdminPropertyListParams(form), page: 1 }));
  }

  return (
    <details open={isOpen} onToggle={handleToggle} className="group rounded-[1.25rem] border border-line bg-surface shadow-soft">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
        <span>
          Filtros
          {activeCount > 0 && (
            <span className="ml-2 inline-flex min-w-6 justify-center rounded-full bg-accent px-2 text-xs leading-6 text-on-accent">
              {activeCount}
            </span>
          )}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 text-muted transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>

      {/* Keyed by the URL: the fields are uncontrolled, so a new URL (clear, back) must reset them. */}
      <form
        key={toAdminPropertyListQuery(params).toString()}
        action={ADMIN_PROPERTIES_PATH}
        method="get"
        noValidate
        onSubmit={handleSubmit}
        aria-label="Filtrar propiedades"
        className="space-y-4 border-t border-line px-5 pb-5 pt-4"
      >
        {params.search && <input type="hidden" name="search" value={params.search} />}

        <div>
          <label htmlFor="filter-status" className={labelClassName}>
            Estado
          </label>
          <select id="filter-status" name="status" defaultValue={params.status === "active" ? "" : params.status} className={controlClassName}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-operation" className={labelClassName}>
            Operación
          </label>
          <select id="filter-operation" name="operation" defaultValue={params.operation ?? ""} className={controlClassName}>
            <option value="">Todas</option>
            {OPERATION_TYPES.map((value) => (
              <option key={value} value={value}>
                {operationLabels[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-type" className={labelClassName}>
            Tipo de propiedad
          </label>
          <select id="filter-type" name="type" defaultValue={params.type ?? ""} className={controlClassName}>
            <option value="">Todos</option>
            {PROPERTY_TYPES.map((value) => (
              <option key={value} value={value}>
                {propertyTypeLabels[value]}
              </option>
            ))}
          </select>
        </div>

        {cities.length > 0 && (
          <div>
            <label htmlFor="filter-city" className={labelClassName}>
              Ciudad
            </label>
            <select id="filter-city" name="city" defaultValue={params.city ?? ""} className={controlClassName}>
              <option value="">Todas</option>
              {cities.map((city) => (
                <option key={city.slug} value={city.slug}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <fieldset>
          <legend className={labelClassName}>Precio (USD)</legend>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="filter-min-price" className="sr-only">
                Precio mínimo
              </label>
              <input
                id="filter-min-price"
                name="minPrice"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="Mínimo"
                defaultValue={params.minPrice ?? ""}
                className={controlClassName}
              />
            </div>
            <div>
              <label htmlFor="filter-max-price" className="sr-only">
                Precio máximo
              </label>
              <input
                id="filter-max-price"
                name="maxPrice"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="Máximo"
                defaultValue={params.maxPrice ?? ""}
                className={controlClassName}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className={labelClassName}>Fecha de creación</legend>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="filter-created-from" className="mb-1 block text-xs text-muted">
                Desde
              </label>
              <input id="filter-created-from" name="createdFrom" type="date" defaultValue={params.createdFrom ?? ""} className={controlClassName} />
            </div>
            <div>
              <label htmlFor="filter-created-to" className="mb-1 block text-xs text-muted">
                Hasta
              </label>
              <input id="filter-created-to" name="createdTo" type="date" defaultValue={params.createdTo ?? ""} className={controlClassName} />
            </div>
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            className="h-11 rounded-full bg-accent px-6 font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover"
          >
            Aplicar filtros
          </button>
          {activeCount > 0 && (
            <Link
              href={hrefFor({ page: 1, search: params.search, status: "active" })}
              className="text-sm font-semibold text-ink underline decoration-brass decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
            >
              Limpiar filtros
            </Link>
          )}
        </div>
      </form>
    </details>
  );
}
