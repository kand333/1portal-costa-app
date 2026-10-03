import type { AdminPropertySummary } from "@portal/shared/admin-property";
import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import type { LocationOption, PaginatedResponse } from "@portal/shared/property";
import Image from "next/image";
import Link from "next/link";
import { Pagination } from "@/components/properties/pagination";
import {
  ADMIN_PROPERTIES_PATH,
  countActiveFilters,
  toAdminPropertyListQuery,
  type AdminPropertyListParams,
} from "@/lib/admin-properties";
import { cn } from "@/lib/cn";
import { formatLocation, formatPrice, operationLabels, propertyTypeLabels } from "@/lib/property-format";
import { AdminPropertyFilters } from "./admin-property-filters";
import { DeletePropertyButton } from "./delete-property-button";

const dateFormatter = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" });
const numberFormatter = new Intl.NumberFormat("es-CL");

const primaryLinkClassName =
  "inline-flex h-12 items-center rounded-full bg-accent px-7 font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover";
const actionClassName =
  "inline-flex h-10 items-center rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:border-brass hover:bg-paper";
const badgeClassName = "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold";

function StatusBadges({ property }: { property: AdminPropertySummary }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span
        className={cn(
          badgeClassName,
          property.isPublished ? "border-accent/40 bg-accent/10 text-ink" : "border-line text-muted",
        )}
      >
        {property.isPublished ? "Publicada" : "Sin publicar"}
      </span>
      {property.isFeatured && <span className={cn(badgeClassName, "border-brass/50 text-brass-text")}>Destacada</span>}
    </div>
  );
}

function AdminPropertyRow({ property }: { property: AdminPropertySummary }) {
  return (
    <li className="flex flex-col gap-4 rounded-[1.25rem] border border-line bg-surface p-4 shadow-soft sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 flex-1 gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-line/40">
          {property.mainImageUrl ? (
            <Image src={property.mainImageUrl} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-center text-xs text-muted">Sin foto</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 font-display text-2xl font-semibold leading-tight tracking-tight text-ink">
            {property.title}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {propertyTypeLabels[property.propertyType]} en {operationLabels[property.operationType].toLowerCase()} ·{" "}
            {formatLocation(property.commune, property.city)}
          </p>
          <p className="mt-1 font-display text-xl font-semibold text-ink tabular-nums lining-nums">
            {formatPrice(property.price, property.currency, property.operationType)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            {!property.deletedAt && <StatusBadges property={property} />}
            <span className="text-xs text-muted">
              Actualizada el <time dateTime={property.updatedAt}>{dateFormatter.format(new Date(property.updatedAt))}</time>
            </span>
          </div>
        </div>
      </div>
      {property.deletedAt ? (
        // Deleted: read only. The deletion date takes the place of the actions.
        <dl className="shrink-0 sm:text-right">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Eliminada el</dt>
          <dd className="mt-1 text-sm font-medium text-ink">
            <time dateTime={property.deletedAt}>{dateTimeFormatter.format(new Date(property.deletedAt))}</time>
          </dd>
        </dl>
      ) : (
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {property.isPublished && (
          <Link href={`/properties/${property.id}`} aria-label={`Ver «${property.title}» en el portal`} className={actionClassName}>
            Ver
          </Link>
        )}
        <Link
          href={`${ADMIN_PROPERTIES_PATH}/${property.id}/edit`}
          aria-label={`Editar «${property.title}»`}
          className={actionClassName}
        >
          Editar
        </Link>
        <DeletePropertyButton propertyId={property.id} propertyTitle={property.title} />
      </div>
      )}
    </li>
  );
}

type AdminPropertyListProps = {
  result: PaginatedResponse<AdminPropertySummary>;
  params: AdminPropertyListParams;
  /** Cities with published properties, for the city filter. */
  cities: LocationOption[];
};

const statusDescriptions: Record<AdminPropertyListParams["status"], string> = {
  active: "Publicadas y sin publicar, de la más reciente a la más antigua.",
  published: "Publicadas, de la más reciente a la más antigua.",
  draft: "Borradores (sin publicar), del más reciente al más antiguo.",
  deleted: "Eliminadas: ya no se ven en el portal. De la última eliminada a la primera.",
};

/** ADMIN property list with search and a filter panel; deleted properties are read only. */
export function AdminPropertyList({ result, params, cities }: AdminPropertyListProps) {
  const { data: properties, meta } = result;
  const { search, status } = params;
  const isDeletedView = status === "deleted";
  const isFiltered = Boolean(search) || countActiveFilters(params) > 0;
  // The search form keeps the filters (one hidden field each); clearing the search keeps them too.
  const filtersOnly = toAdminPropertyListQuery({ ...params, search: "", page: 1 });
  const withoutSearch = filtersOnly.toString();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <Link
        href="/admin"
        className="inline-flex text-sm font-semibold text-muted underline decoration-brass decoration-1 underline-offset-4 transition-colors duration-200 hover:text-ink"
      >
        Volver al panel
      </Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">Propiedades</h1>
          <p className="mt-2 text-lg text-muted">{statusDescriptions[status]}</p>
        </div>
        <Link href={`${ADMIN_PROPERTIES_PATH}/new`} className={primaryLinkClassName}>
          Nueva propiedad
        </Link>
      </div>

      {/* Filters on the right from xl up; above the list on narrower screens. */}
      <div className="mt-8 flex flex-col gap-6 xl:flex-row-reverse xl:items-start">
        <aside aria-label="Filtros de propiedades" className="xl:sticky xl:top-6 xl:w-72 xl:shrink-0">
          <AdminPropertyFilters params={params} cities={cities} />
        </aside>

        <div className="min-w-0 flex-1">
          {/* A plain GET form: the search lives in the URL and works without JavaScript. */}
          <form action={ADMIN_PROPERTIES_PATH} method="get" role="search" aria-label="Buscar propiedades" className="flex flex-wrap gap-3">
            {[...filtersOnly].map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <div className="min-w-0 flex-1 basis-64">
              <label htmlFor="admin-property-search" className="sr-only">
                Buscar por título, comuna, ciudad, región o descripción
              </label>
              <input
                id="admin-property-search"
                name="search"
                type="search"
                defaultValue={search}
                maxLength={MAX_SEARCH_LENGTH}
                placeholder="Busca por título, comuna o ciudad"
                className="h-12 w-full rounded-full border border-line bg-surface px-5 text-ink shadow-soft transition-colors duration-200 hover:border-brass/60 focus-visible:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40"
              />
            </div>
            <button
              type="submit"
              className="h-12 rounded-full border border-line px-7 font-semibold text-ink transition-colors duration-200 hover:border-brass hover:bg-surface"
            >
              Buscar
            </button>
            {search && (
              <Link
                href={withoutSearch ? `${ADMIN_PROPERTIES_PATH}?${withoutSearch}` : ADMIN_PROPERTIES_PATH}
                className="inline-flex h-12 items-center px-2 text-sm font-semibold text-ink underline decoration-brass decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
              >
                Limpiar búsqueda
              </Link>
            )}
          </form>

          <p aria-live="polite" className="mt-6 text-sm text-muted">
            {meta.total === 1 ? "1 propiedad" : `${numberFormatter.format(meta.total)} propiedades`}
            {isDeletedView && (meta.total === 1 ? " eliminada" : " eliminadas")}
            {search && ` para «${search}»`}
          </p>

          {properties.length === 0 ? (
            <p className="mt-4 rounded-[1.25rem] border border-dashed border-line p-8 text-center text-muted">
              {meta.total === 0
                ? isFiltered
                  ? "Ninguna propiedad coincide con la búsqueda o los filtros."
                  : "Aún no hay propiedades. Crea la primera."
                : "No hay propiedades en esta página."}
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {properties.map((property) => (
                <AdminPropertyRow key={property.id} property={property} />
              ))}
            </ul>
          )}

          <Pagination
            pathname={ADMIN_PROPERTIES_PATH}
            searchParams={toAdminPropertyListQuery(params)}
            currentPage={meta.page}
            totalPages={meta.totalPages}
          />
        </div>
      </div>
    </div>
  );
}
