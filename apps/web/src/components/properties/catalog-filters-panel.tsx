"use client";

import { OPERATION_TYPES, PROPERTY_TYPES } from "@portal/shared/enums";
import { citiesOfRegion, DEFAULT_REGION_SLUG, REGION_FIELD_LABEL, REGIONS, sectorsOfCity } from "@portal/shared/locations";
import type { LocationOption } from "@portal/shared/property";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
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
    region: filters.region ?? [DEFAULT_REGION_SLUG],
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

/** Keeps the selected slug visible even if it is not among the options (old link, typo). */
function withSelectedOption(options: readonly LocationOption[], selectedSlug: string): readonly LocationOption[] {
  if (selectedSlug === "" || options.some((option) => option.slug === selectedSlug)) return options;
  return [...options, { slug: selectedSlug, name: selectedSlug }];
}

type CatalogFiltersPanelProps = {
  /** Active filters, read from the URL. */
  filters: CatalogFilters;
};

export function CatalogFiltersPanel({ filters }: CatalogFiltersPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  /** There is no «Buscar» button: every choice applies on its own (see `applyNow`). */
  function applyNow(next: FormValues) {
    if (next.minPrice !== "" && next.maxPrice !== "" && Number(next.minPrice) > Number(next.maxPrice)) {
      setPriceError("El precio mínimo no puede ser mayor que el máximo.");
      maxPriceRef.current?.focus();
      return;
    }
    router.push(buildCatalogFiltersHref(pathname, currentParams(), parseCatalogFilters(toSearchParams(next))));
  }

  // Lists, checkboxes and selects apply as soon as they change; the number fields apply when they lose focus or on Enter.
  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    const next = { ...values, [name]: value };
    setValues(next);
    if (name === "minPrice" || name === "maxPrice") setPriceError(null);
    if (event.target instanceof HTMLSelectElement) applyNow(next);
  }

  function handleNumberBlur() {
    if (JSON.stringify(parseCatalogFilters(toSearchParams(values))) !== JSON.stringify(filters)) applyNow(values);
  }

  function handleNumberKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    applyNow(values);
  }

  function handleCheckboxChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value, checked } = event.target;
    const filterName = name as LocationFilterName | "operation";
    const next: FormValues = {
      ...values,
      [filterName]: checked ? [...values[filterName], value] : values[filterName].filter((slug) => slug !== value),
    };
    setValues(next);
    if (filterName === "operation") applyNow(next);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyNow(values);
  }

  // Region, city and sector are chained: the region sets the cities and the city sets the sectors.
  const regionSlug = values.region[0] ?? DEFAULT_REGION_SLUG;
  const citySlug = values.city[0] ?? "";
  const communeSlug = values.commune[0] ?? "";
  const cityOptions = withSelectedOption(citiesOfRegion(regionSlug), citySlug);
  const sectorOptions = withSelectedOption(sectorsOfCity(citySlug), communeSlug);

  function changeRegion(slug: string) {
    const keepsCity = citiesOfRegion(slug).some((city) => city.slug === values.city[0]);
    const next: FormValues = { ...values, region: [slug], city: keepsCity ? values.city : [], commune: keepsCity ? values.commune : [] };
    setValues(next);
    applyNow(next);
  }

  function changeCity(slug: string) {
    const next: FormValues = { ...values, city: slug ? [slug] : [], commune: [] };
    setValues(next);
    applyNow(next);
  }

  function changeSector(slug: string) {
    const next: FormValues = { ...values, commune: slug ? [slug] : [] };
    setValues(next);
    applyNow(next);
  }

  const sectorPlaceholder = citySlug === "" ? "Elige una comuna" : sectorOptions.length === 0 ? "Próximamente" : "Todos";

  // «Más filtros» starts open when one of its fields is already filtering.
  const hasSecondaryFilter = Boolean(
    filters.commune?.length || filters.bathrooms || filters.minUsableArea || filters.minPrice || (filters.region && filters.region.join() !== DEFAULT_REGION_SLUG),
  );
  const [showMoreChoice, setShowMoreChoice] = useState<boolean | null>(null);
  const showMore = showMoreChoice ?? hasSecondaryFilter;
  // On narrow screens only operation and comuna stay in view: type, maximum price and bedrooms fold with the rest.
  const foldedOnPhone = showMore ? undefined : "max-lg:hidden";
  const hiddenActiveCount = countActiveFilters({ ...filters, operation: undefined, city: undefined });

  return (
    <div>
      <form
        id={panelId}
        aria-label="Filtros del catálogo"
        action={pathname}
        method="get"
        noValidate
        onSubmit={handleSubmit}
        className="rounded-[1.25rem] border border-line bg-surface p-4 shadow-soft sm:p-5"
      >
        <h2 className="sr-only">Filtrar propiedades</h2>

        {/* The filters people use most, in one bar: operation, comuna, type, maximum price and bedrooms. Each one applies on its own: there is no search button. */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[auto_1fr_1fr_1fr_8rem] lg:items-end">
          {/* One line for both on phones; from `lg` the wrapper disappears and each one is a cell of the bar. */}
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 sm:col-span-2 lg:contents">
          <fieldset>
            <legend className={`${labelClassName} h-5 leading-5`}>Operación</legend>
            <div className="flex gap-2">
              {OPERATION_TYPES.map((operation) => (
                <div key={operation}>
                  <input
                    id={`filter-operation-${operation}`}
                    type="checkbox"
                    name="operation"
                    value={operation}
                    checked={values.operation.includes(operation)}
                    onChange={handleCheckboxChange}
                    className="peer sr-only"
                  />
                  <label
                    htmlFor={`filter-operation-${operation}`}
                    className="inline-flex h-11 cursor-pointer items-center rounded-full border border-line bg-paper px-2.5 text-[0.8125rem] min-[400px]:px-3 min-[400px]:text-sm sm:px-4 font-semibold text-muted transition-colors duration-200 hover:border-brass peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
                  >
                    {operation === "SALE" ? "En venta" : operationLabels[operation]}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="filter-city" className={`${labelClassName} h-5 leading-5`}>
              Comuna
            </label>
            <select id="filter-city" name="city" value={citySlug} onChange={(event) => changeCity(event.target.value)} className={`${fieldClassName} min-w-0 max-w-full`}>
              <option value="">Todas</option>
              {cityOptions.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          </div>

          <div className={foldedOnPhone}>
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

          <div className={foldedOnPhone}>
            <label htmlFor="filter-maxPrice" className={labelClassName}>
              Precio máximo (CLP)
            </label>
            <input
              ref={maxPriceRef}
              id="filter-maxPrice"
              name="maxPrice"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Sin tope"
              value={values.maxPrice}
              onChange={handleChange}
              onBlur={handleNumberBlur}
              onKeyDown={handleNumberKeyDown}
              aria-invalid={priceError ? true : undefined}
              aria-describedby={priceError ? priceErrorId : undefined}
              className={fieldClassName}
            />
          </div>

          <div className={foldedOnPhone}>
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

        </div>

        {priceError && (
          <p id={priceErrorId} role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
            {priceError}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
          <button
            type="button"
            aria-expanded={showMore}
            aria-controls="catalog-filters-more"
            onClick={() => setShowMoreChoice(!showMore)}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-ink underline decoration-brass decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
          >
            {showMore ? "Menos filtros" : "Más filtros"}
            {hiddenActiveCount > 0 && (
              <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-on-accent lg:hidden">
                {hiddenActiveCount}
                <span className="sr-only"> {hiddenActiveCount === 1 ? "filtro activo" : "filtros activos"}</span>
              </span>
            )}
          </button>
          {activeCount > 0 && (
            <Link
              href={buildCatalogFiltersHref(pathname, currentParams(), {})}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-muted underline decoration-1 underline-offset-4 transition-colors duration-200 hover:text-ink"
            >
              Limpiar filtros
            </Link>
          )}
        </div>

        {/* Kept in the form even when folded, so its values are never lost. */}
        <div id="catalog-filters-more" hidden={!showMore} className="mt-3 grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="filter-region" className={labelClassName}>
              {REGION_FIELD_LABEL}
            </label>
            <select id="filter-region" name="region" value={regionSlug} onChange={(event) => changeRegion(event.target.value)} className={fieldClassName}>
              {REGIONS.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-commune" className={labelClassName}>
              Sector
            </label>
            <select
              id="filter-commune"
              name="commune"
              value={communeSlug}
              onChange={(event) => changeSector(event.target.value)}
              disabled={sectorOptions.length === 0}
              className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <option value="">{sectorPlaceholder}</option>
              {sectorOptions.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-minPrice" className={labelClassName}>
              Precio mínimo (CLP)
            </label>
            <input
              id="filter-minPrice"
              name="minPrice"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Sin mínimo"
              value={values.minPrice}
              onChange={handleChange}
              onBlur={handleNumberBlur}
              onKeyDown={handleNumberKeyDown}
              aria-invalid={priceError ? true : undefined}
              aria-describedby={priceError ? priceErrorId : undefined}
              className={fieldClassName}
            />
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
              onBlur={handleNumberBlur}
              onKeyDown={handleNumberKeyDown}
              className={fieldClassName}
            />
          </div>

          {/* The only «Buscar»: desktop only, with «Más filtros» open. On phones everything applies on its own. */}
          {showMore && (
            <button
              type="submit"
              className="h-11 rounded-full bg-accent px-7 text-sm font-semibold text-on-accent transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-accent-hover active:translate-y-0 max-lg:hidden lg:col-span-5"
            >
              Buscar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
