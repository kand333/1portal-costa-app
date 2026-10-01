import Image from "next/image";
import Link from "next/link";
import { formatLocation, formatPrice, operationLabels, propertyTypeLabels } from "@/lib/property-format";
import type { PropertySummary } from "@portal/shared/property";

type PropertyCardProps = {
  property: PropertySummary;
};

export function PropertyCard({ property }: PropertyCardProps) {
  const location = formatLocation(property.commune, property.city);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
        {property.mainImageUrl ? (
          <Image
            src={property.mainImageUrl}
            alt={`${propertyTypeLabels[property.propertyType]} en ${location}: ${property.title}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
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
        <p className="mt-auto pt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {propertyTypeLabels[property.propertyType]} · {location}
        </p>
      </div>
    </article>
  );
}
