import Image from "next/image";
import Link from "next/link";
import type { PropertySummary } from "@portal/shared/property";
import {
  formatLocation,
  formatPrice,
  getPropertyHighlights,
  operationLabels,
  propertyTypeLabels,
  type PropertyHighlight,
} from "@/lib/property-format";

type PropertyCardProps = {
  property: PropertySummary;
};

// Decorative icons: the text next to each one already carries the meaning.
const highlightIconPaths: Record<PropertyHighlight["kind"], string> = {
  bedrooms: "M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 14h18M3 18v2M21 18v2M7 10V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3",
  bathrooms: "M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2",
  area: "M4 4h16v16H4ZM4 9h5M15 4v5M9 20v-5M20 15h-5",
};

export function PropertyCard({ property }: PropertyCardProps) {
  const location = formatLocation(property.commune, property.city);
  const propertyTypeLabel = propertyTypeLabels[property.propertyType];
  const highlights = getPropertyHighlights(property);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
        {property.mainImageUrl ? (
          <Image
            src={property.mainImageUrl}
            alt={`${propertyTypeLabel} en ${location}: ${property.title}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">Sin fotografía</div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-zinc-900 shadow-sm">
          {operationLabels[property.operationType]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-lg font-semibold text-sky-800 dark:text-sky-300">
          {formatPrice(property.price, property.currency, property.operationType)}
        </p>
        <h3 className="line-clamp-2 font-medium text-zinc-900 dark:text-zinc-100">
          {/* The stretched link makes the whole card clickable while keeping one focusable element. */}
          <Link
            href={`/properties/${property.id}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-has-[a:focus-visible]:underline"
          >
            {property.title}
          </Link>
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {propertyTypeLabel} · {location}
        </p>
        {highlights.length > 0 && (
          <ul
            aria-label="Características principales"
            className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-zinc-100 pt-3 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
          >
            {highlights.map((highlight) => (
              <li key={highlight.kind} className="flex items-center gap-1.5">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4 shrink-0 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={highlightIconPaths[highlight.kind]} />
                </svg>
                {highlight.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
