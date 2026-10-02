"use client";

import { OPERATION_TYPES, PROPERTY_TYPES } from "@portal/shared/enums";
import type { LocationOption } from "@portal/shared/property";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useFilterOptions } from "@/hooks/use-filter-options";
import {
  buildCatalogFiltersHref,
  countActiveFilters,
  LOCATION_FILTER_NAMES,
  parseCatalogFilters,
  type CatalogFilters,
} from "@/lib/catalog-filters";
import { operationLabels, propertyTypeLabels } from "@/lib/property-format";

type LocationFilterName = (typeof LOCATION_FILTER_NAMES)[number];
type SingleValueName = "type" | "minPrice" | "maxPrice" | "bedrooms" | "bathrooms" | "minUsableArea";
type FormValues = Record<SingleValueName, string> & Record<LocationFilterName | "operation", string[]>;

const panelId = "catalog-filters";
const priceErrorId = "catalog-filters-price-error";
const ROOM_OPTIONS = [1, 2, 3, 4, 5];

const fieldClassName =
  "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink transition-colors duration-200 hover:border-brass/60 focus-visible:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40";
const labelClassName = "mb-1.5 block text-sm font-medium text-ink";

const toText = (value: number | string | undefined) => (value === undefined ? "" : String(value));

function toFormValues(filters: CatalogFilters): FormValues {
  return {
    // No operation filter means both are shown, so both boxes start checked.
    operation: filters.operation ? [filters.operation] : [...OPERATION_TYPES],
    type: toText(filters.type),
    minPrice: toText(filters.minPrice),
    maxPrice: toText(filters.maxPrice),
    bedrooms: toText(filters.bedrooms),
    bathrooms: toText(filters.bathrooms),
    minUsableArea: toText(filters.minUsableArea),
    region: filters.region ?? [],
    city: filters.city ?? [],
    commune: filters.commune ?? [],
  };
}

function toSearchParams(values: FormValues): URLSearchParams {
  const searchParams = new URLSearchParams();
  for (const [name, value] of Object.entries(values)) {
    // `operation` holds a single value: only one checked box filters; both or none mean "all".
    if (name === "operation" && value.length !== 1) continue;
    for (const item of [value].flat()) searchParams.append(name, item);
  }
  return searchParams;
}

/** Keeps selected slugs visible even if they are not among the loaded options (old link, typo). */
function withSelectedOptions(options: LocationOption[], selectedSlugs: string[]): LocationOption[] {
  const missing = selectedSlugs.filter((slug) => !options.some((option) => option.slug === slug));
  return [...options, ...missing.map((slug) => ({ slug, name: slug }))];
}

type CatalogFiltersPanelProps = {
  /** Active filters, read from the URL. */
  filters: CatalogFilters;
  isOpen: boolean;
  onToggle: () => void;
  /** Close the panel after applying (small screens, so the results are visible). */
  closeAfterApply: boolean;
};

export function CatalogFiltersPanel({ filters, isOpen, onToggle, closeAfterApply }: CatalogFiltersPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: options, error: optionsError, isLoading: optionsLoading } = useFilterOptions();
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const maxPriceRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState(() => toFormValues(filters));
  const [priceError, setPriceError] = useState<string | null>(null);

  // Follow the URL (back/forward, "clear filters") without re-mounting the form, which would lose
  // the keyboard focus. Adjusting state while rendering is React's recommended pattern.
  const filtersKey = JSON.stringify(filters);
  const [syncedFiltersKey, setSyncedFiltersKey] = useState(filtersKey);
  if (filtersKey !== syncedFiltersKey) {
    setSyncedFiltersKey(filtersKey);
    setValues(toFormValues(filters));
    setPriceError(null);
  }

  const activeCount = countActiveFilters(filters);
  const currentParams = () => new URLSearchParams(searchParams.toString());

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    if (name === "minPrice" || name === "maxPrice") setPriceError(null);
  }

  function handleCheckboxChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value, checked } = event.target;
    const filterName = name as LocationFilterName | "operation";
    setValues((previous) => ({
      ...previous,
      [filterName]: checked
        ? [...previous[filterName], value]
        : previous[filterName].filter((slug) => slug !== value),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (values.minPrice !== "" && values.maxPrice !== "" && Number(values.minPrice) > Number(values.maxPrice)) {
      setPriceError("El precio mínimo no puede ser mayor que el máximo.");
      maxPriceRef.current?.focus();
      return;
    }

    router.push(buildCatalogFiltersHref(pathname, currentParams(), parseCatalogFilters(toSearchParams(values))));
    if (closeAfterApply) {
      onToggle();
      toggleButtonRef.current?.focus();
    }
  }

  // Single choice: the API accepts several values, but the form offers one region and one city.
  const locationSelect = (filterName: "region" | "city", label: string, list: LocationOption[] = []) => {
    const selected = values[filterName][0] ?? "";
    return (
      <div>
        <label htmlFor={`filter-${filterName}`} className={labelClassName}>
          {label}
        </label>
        <select
          id={`filter-${filterName}`}
          name={filterName}
          value={selected}
          onChange={(event) =>
            setValues((previous) => ({ ...previous, [filterName]: event.target.value ? [event.target.value] : [] }))
          }
          disabled={optionsLoading && !selected}
          className={fieldClassName}
        >
          <option value="">{optionsLoading ? "Cargando…" : "Todas"}</option>
          {withSelectedOptions(list, selected ? [selected] : []).map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const locationCheckboxes = (filterName: LocationFilterName, legend: string, list: LocationOption[] = []) => {
    const selected = values[filterName];
    const items = withSelectedOptions(list, selected);
    return (
      <fieldset>
        <legend className={labelClassName}>
          {legend}
          {selected.length > 0 && (
            <span className="font-normal text-muted"> ({selected.length} seleccionadas)</span>
          )}
        </legend>
        {optionsLoading && items.length === 0 ? (
          <p className="text-sm text-muted">Cargando…</p>
        ) : (
          // Scrolls when the list is long so the panel keeps a reasonable height.
          <ul className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-line p-3">
            {items.map((option) => {
              const checkboxId = `filter-${filterName}-${option.slug}`;
              return (
                <li key={option.slug} className="flex items-center gap-2">
                  <input
                    id={checkboxId}
                    type="checkbox"
                    name={filterName}
                    value={option.slug}
                    checked={selected.includes(option.slug)}
                    onChange={handleCheckboxChange}
                    className="size-4 rounded accent-[var(--accent)]"
                  />
                  <label htmlFor={checkboxId} className="text-sm text-ink">
                    {option.name}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </fieldset>
    );
  };

  return (
    <div>
      <button
        ref={toggleButtonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="mb-4 inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-brass hover:bg-surface"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        {isOpen ? "Ocultar filtros" : "Mostrar filtros"}
        {activeCount > 0 && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-on-accent">
            {activeCount}
            <span className="sr-only"> {activeCount === 1 ? "filtro activo" : "filtros activos"}</span>
          </span>
        )}
      </button>

      <form
        id={panelId}
        aria-label="Filtros del catálogo"
        action={pathname}
        method="get"
        noValidate
        hidden={!isOpen}
        onSubmit={handleSubmit}
        className="space-y-5 rounded-[1.25rem] border border-line bg-surface p-5"
      >
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Filtrar propiedades</h2>

        <fieldset>
          <legend className={labelClassName}>Operación</legend>
          <div className="flex gap-4">
            {OPERATION_TYPES.map((operation) => (
              <div key={operation} className="flex items-center gap-2">
                <input
                  id={`filter-operation-${operation}`}
                  type="checkbox"
                  name="operation"
                  value={operation}
                  checked={values.operation.includes(operation)}
                  onChange={handleCheckboxChange}
                  className="size-4 rounded accent-[var(--accent)]"
                />
                <label htmlFor={`filter-operation-${operation}`} className="text-sm text-ink">
                  {operationLabels[operation]}
                </label>
              </div>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="filter-type" className={labelClassName}>
            Tipo de propiedad
          </label>
          <select id="filter-type" name="type" value={values.type} onChange={handleChange} className={fieldClassName}>
            <option value="">Todos los tipos</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {propertyTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className={labelClassName}>Precio (US$)</legend>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="filter-minPrice" className="sr-only">
                Precio mínimo en dólares
              </label>
              <input
                id="filter-minPrice"
                name="minPrice"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Mínimo"
                value={values.minPrice}
                onChange={handleChange}
                aria-invalid={priceError ? true : undefined}
                aria-describedby={priceError ? priceErrorId : undefined}
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="filter-maxPrice" className="sr-only">
                Precio máximo en dólares
              </label>
              <input
                ref={maxPriceRef}
                id="filter-maxPrice"
                name="maxPrice"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Máximo"
                value={values.maxPrice}
                onChange={handleChange}
                aria-invalid={priceError ? true : undefined}
                aria-describedby={priceError ? priceErrorId : undefined}
                className={fieldClassName}
              />
            </div>
          </div>
          {priceError && (
            <p id={priceErrorId} role="alert" className="mt-1 text-sm text-red-700 dark:text-red-400">
              {priceError}
            </p>
          )}
        </fieldset>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="filter-bedrooms" className={labelClassName}>
              Dormitorios
            </label>
            <select id="filter-bedrooms" name="bedrooms" value={values.bedrooms} onChange={handleChange} className={fieldClassName}>
              <option value="">Cualquiera</option>
              {ROOM_OPTIONS.map((rooms) => (
                <option key={rooms} value={rooms}>
                  {rooms}+
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-bathrooms" className={labelClassName}>
              Baños
            </label>
            <select id="filter-bathrooms" name="bathrooms" value={values.bathrooms} onChange={handleChange} className={fieldClassName}>
              <option value="">Cualquiera</option>
              {ROOM_OPTIONS.map((rooms) => (
                <option key={rooms} value={rooms}>
                  {rooms}+
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="filter-minUsableArea" className={labelClassName}>
            Superficie útil mínima (m²)
          </label>
          <input
            id="filter-minUsableArea"
            name="minUsableArea"
            type="number"
            inputMode="numeric"
            min={0}
            value={values.minUsableArea}
            onChange={handleChange}
            className={fieldClassName}
          />
        </div>

        {locationCheckboxes("commune", "Comuna", options?.communes)}
        {locationSelect("city", "Ciudad", options?.cities)}
        {locationSelect("region", "Región", options?.regions)}
        {optionsError && (
          <p className="text-sm text-muted">No pudimos cargar las ubicaciones disponibles.</p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            className="h-11 rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-accent-hover active:translate-y-0"
          >
            Aplicar filtros
          </button>
          {activeCount > 0 && (
            <Link
              href={buildCatalogFiltersHref(pathname, currentParams(), {})}
              className="border-b border-brass pb-0.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink"
            >
              Limpiar filtros
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
