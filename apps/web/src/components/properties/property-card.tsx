"use client";

import Image from "next/image";
import Link from "next/link";
import { PointerGlow } from "@/components/ui/pointer-glow";
import { FavoriteButton } from "./favorite-button";
import { useUfValue } from "./uf-value-context";
import type { PropertySummary } from "@portal/shared/property";
import {
  formatClp,
  formatLocation,
  formatPrice,
  formatUfAmount,
  getCardStats,
  propertyTypeLabels,
  toUf,
  type PropertyStat,
} from "@/lib/property-format";

type PropertyCardProps = {
  property: PropertySummary;
};

// Decorative icons: the text next to each one already carries the meaning.
const highlightIconPaths: Record<PropertyStat["kind"], string> = {
  bedrooms: "M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 14h18M3 18v2M21 18v2M7 10V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3",
  bathrooms: "M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2",
  area: "M4 4h16v16H4ZM4 9h5M15 4v5M9 20v-5M20 15h-5",
};

/** Corner badge: orange for sales and the brand blue for rentals; both texts pass AA contrast. */
const operationBadge: Record<PropertySummary["operationType"], { label: string; className: string }> = {
  SALE: { label: "En venta", className: "bg-accent text-on-accent" },
  RENT: { label: "Arriendo", className: "bg-brand-blue text-white" },
};

export function PropertyCard({ property }: PropertyCardProps) {
  const location = formatLocation(property.commune, property.city);
  const propertyTypeLabel = propertyTypeLabels[property.propertyType];
  const stats = getCardStats(property);
  const uf = toUf(property.price, useUfValue());
  const isSaleInUf = property.operationType === "SALE" && uf !== null;

  return (
    <PointerGlow className="relative h-full rounded-[1.25rem] transition-transform duration-500 ease-out hover:-translate-y-0.5 motion-reduce:transform-none">
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-line/70 bg-surface shadow-soft transition-shadow duration-500 hover:shadow-lift">
      <div className="relative aspect-[5/4] overflow-hidden bg-line/40">
        {property.mainImageUrl ? (
          <Image
            src={property.mainImageUrl}
            alt={`${propertyTypeLabel} en ${location}: ${property.title}`}
            fill
            // 3 columns up to the 80rem container (≈ 400px each), 2 from `sm`, 1 below.
            sizes="(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">Sin fotografía</div>
        )}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent" />
        <span className={`absolute left-4 top-4 rounded-full px-3.5 py-1 text-xs font-bold shadow-soft ${operationBadge[property.operationType].className}`}>
          {operationBadge[property.operationType].label}
        </span>
        <div className="absolute right-3 top-3">
          <FavoriteButton propertyId={property.id} propertyTitle={property.title} variant="overlay" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-6">
        {isSaleInUf ? (
          <p className="flex flex-wrap items-baseline gap-x-3 text-brass-text tabular-nums">
            <span className="font-display text-3xl font-bold leading-none tracking-tight">{formatUfAmount(uf)}</span>
            <span className="text-sm text-muted">{formatClp(property.price)}</span>
          </p>
        ) : (
          <p className="font-display text-3xl font-bold leading-none tracking-tight text-brass-text tabular-nums">
            {property.operationType === "SALE" ? formatClp(property.price) : formatPrice(property.price, property.currency, property.operationType)}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 font-medium leading-snug text-ink">
          {/* The stretched link makes the whole card clickable while keeping one focusable element. */}
          <Link
            href={`/properties/${property.id}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-has-[a:focus-visible]:underline"
          >
            {property.title}
          </Link>
        </h3>
        <p className="text-sm text-muted">
          <span className="font-medium text-brass-text">{location}</span>
          {property.sector ? ` (sector ${property.sector})` : ""}
        </p>
        <p className="text-xs text-muted tabular-nums">Cód. {property.code}</p>
        {stats.length > 0 && (
          <ul
            aria-label="Características principales"
            className={`mt-auto grid gap-2 pt-4 ${stats.length === 1 ? "grid-cols-1" : stats.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}
          >
            {stats.map((stat) => (
              <li
                key={stat.kind}
                className="flex flex-col items-center gap-1 rounded-xl border border-line/70 bg-paper px-2 py-2.5 text-center text-sm font-medium text-ink"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-5 shrink-0 text-brass-text"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={highlightIconPaths[stat.kind]} />
                </svg>
                {stat.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
    <div className="glow-ring" aria-hidden="true" />
    </PointerGlow>
  );
}
