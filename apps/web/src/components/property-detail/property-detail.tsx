import type { PropertyDetail as PropertyDetailData } from "@portal/shared/property";
import Link from "next/link";
import {
  formatLocation,
  formatPrice,
  getPropertyFacts,
  operationLabels,
  propertyTypeLabels,
} from "@/lib/property-format";
import { buildGoogleMapsUrl, buildMapQuery, formatPropertyAddress, type MapLocation } from "@/lib/property-location";
import { FavoriteButton } from "@/components/properties/favorite-button";
import { PropertyContactForm } from "./property-contact-form";
import { PropertyGallery } from "./property-gallery";
import { PropertyMap } from "./property-map";

type PropertyDetailProps = {
  property: PropertyDetailData;
  /** Geocoded point of the address, or null when it could not be found. */
  mapLocation: MapLocation | null;
};

export function PropertyDetail({ property, mapLocation }: PropertyDetailProps) {
  const location = formatLocation(property.commune, property.city);
  const propertyTypeLabel = propertyTypeLabels[property.propertyType];
  const facts = getPropertyFacts(property);
  const fullAddress = formatPropertyAddress(property);

  return (
    <article className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <Link
        href="/properties"
        className="inline-flex text-sm font-semibold text-muted underline decoration-brass decoration-1 underline-offset-4 transition-colors duration-200 hover:text-ink"
      >
        Volver al catálogo
      </Link>

      <header className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-muted">
            {propertyTypeLabel} en {operationLabels[property.operationType].toLowerCase()} en {location}
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl">
            {property.title}
          </h1>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-5 lg:flex-col lg:items-end">
          <p className="font-display text-4xl font-semibold tracking-tight text-ink tabular-nums sm:text-5xl">
            {formatPrice(property.price, property.currency, property.operationType)}
          </p>
          <FavoriteButton propertyId={property.id} propertyTitle={property.title} variant="inline" />
        </div>
      </header>

      <div className="mt-10">
        <PropertyGallery
          images={property.images}
          imageDescription={`${propertyTypeLabel} en ${location}: ${property.title}`}
        />
      </div>

      <div className="mt-14 grid gap-14 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-14">
          <section aria-labelledby="description-title">
            <h2 id="description-title" className="font-display text-3xl font-semibold tracking-tight text-ink">
              Descripción
            </h2>
            {/* Keeps the paragraphs the administrator wrote. */}
            <p className="mt-5 max-w-prose whitespace-pre-line text-lg leading-relaxed text-ink/85">
              {property.description}
            </p>
          </section>

          {property.features.length > 0 && (
            <section aria-labelledby="features-title">
              <h2 id="features-title" className="font-display text-3xl font-semibold tracking-tight text-ink">
                Características
              </h2>
              <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {property.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 border-b border-line/70 pb-3 text-ink">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="size-4 shrink-0 text-brass-text"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="location-title">
            <h2 id="location-title" className="font-display text-3xl font-semibold tracking-tight text-ink">
              Ubicación
            </h2>
            <address className="mt-5 not-italic text-lg text-ink/85">
              <a
                href={buildGoogleMapsUrl(buildMapQuery(property))}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 hover:underline dark:text-blue-400"
              >
                {fullAddress}
                <span className="sr-only"> (abre Google Maps en una pestaña nueva)</span>
              </a>
            </address>
            <div className="mt-6">
              <PropertyMap query={buildMapQuery(property)} location={mapLocation} />
            </div>
          </section>
        </div>

        {/* Not sticky: with the contact form it is taller than the screen. */}
        <aside aria-label="Ficha y contacto" className="space-y-6 lg:self-start">
          <div className="rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft">
            <h2 id="facts-title" className="font-display text-2xl font-semibold tracking-tight text-ink">
              Ficha de la propiedad
            </h2>
            <dl className="mt-4 divide-y divide-line/70">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-muted">{fact.label}</dt>
                  <dd className="text-right font-medium text-ink tabular-nums">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <PropertyContactForm propertyId={property.id} propertyTitle={property.title} />
        </aside>
      </div>
    </article>
  );
}
