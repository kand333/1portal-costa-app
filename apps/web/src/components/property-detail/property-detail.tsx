import type { PropertyDetail as PropertyDetailData } from "@portal/shared/property";
import Link from "next/link";
import { formatLocation, getDetailStats, getPropertyFacts, propertyTypeLabels } from "@/lib/property-format";
import { buildExecutiveCallUrl, buildExecutiveWhatsAppUrl, PROPERTY_EXECUTIVE } from "@/lib/property-executive";
import { buildGoogleMapsUrl, buildMapQuery, formatPropertyAddress, type MapLocation } from "@/lib/property-location";
import { FavoriteButton } from "@/components/properties/favorite-button";
import { PropertyContactBar } from "./property-contact-bar";
import { PropertyContactForm } from "./property-contact-form";
import { PropertyGallery } from "./property-gallery";
import { PropertyMap } from "./property-map";
import { PropertyPrice } from "./property-price";
import { ShareButton } from "./share-button";

type PropertyDetailProps = {
  property: PropertyDetailData;
  /** Geocoded point of the address, or null when it could not be found. */
  mapLocation: MapLocation | null;
};

export function PropertyDetail({ property, mapLocation }: PropertyDetailProps) {
  const location = formatLocation(property.commune, property.city);
  const propertyTypeLabel = propertyTypeLabels[property.propertyType];
  const facts = getPropertyFacts(property);
  const stats = getDetailStats(property);
  const isSale = property.operationType === "SALE";
  const fullAddress = formatPropertyAddress(property);

  return (
    <article className="mx-auto w-full max-w-7xl px-4 pb-36 pt-6 sm:px-6 lg:px-8 lg:pb-20">
      <nav aria-label="Migas de pan" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href="/" className="underline-offset-4 hover:text-ink hover:underline">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href={`/properties?operation=${property.operationType}`} className="underline-offset-4 hover:text-ink hover:underline">
              {isSale ? "Venta" : "Arriendo"}
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>{property.commune}</li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="tabular-nums text-ink">
            {property.code}
          </li>
        </ol>
      </nav>

      <header className="mt-6 max-w-4xl">
        <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brass-text">
          <span aria-hidden="true" className="h-0.5 w-6 bg-accent" />
          {isSale ? "En venta" : "En arriendo"}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl">
          {property.title}
        </h1>
        <p className="mt-2 text-muted">
          {propertyTypeLabel} en {location}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted tabular-nums">Código {property.code}</span>
          <FavoriteButton propertyId={property.id} propertyTitle={property.title} variant="inline" />
          <ShareButton title={property.title} />
        </div>
      </header>

      <div className="mt-10">
        <PropertyGallery
          images={property.images}
          imageDescription={`${propertyTypeLabel} en ${location}: ${property.title}`}
        />
      </div>

      {stats.length > 0 && (
        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-line/70 bg-surface px-4 py-4">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block font-display text-3xl font-semibold leading-none text-brass-text tabular-nums">{stat.value}</span>
                <span className="mt-1 block text-sm text-muted">{stat.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,1fr)_22rem]">
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
                Lo que tiene
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
            <p className="mt-3 text-sm text-muted">
              El punto marca la ubicación de la propiedad. El ejecutivo te da la dirección exacta al coordinar la visita.
            </p>
          </section>
        </div>

        {/* Not sticky: with the contact form it is taller than the screen. */}
        <aside aria-label="Ficha y contacto" className="space-y-6 lg:self-start">
          <div className="rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft">
            <PropertyPrice price={property.price} currency={property.currency} operationType={property.operationType} />
            <p className="mt-1 text-sm text-muted tabular-nums">Código {property.code}</p>
            <div className="mt-5 border-t border-line/70 pt-5">
              <p className="font-display text-2xl font-semibold text-ink">{PROPERTY_EXECUTIVE.name}</p>
              <p className="text-sm text-muted">{PROPERTY_EXECUTIVE.role}</p>
              <div className="mt-4 grid gap-2">
                <a
                  href={buildExecutiveWhatsAppUrl(property)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 items-center justify-center rounded-full bg-[#25D366] px-5 font-bold text-[#08301a] shadow-soft transition-transform duration-200 hover:-translate-y-0.5"
                >
                  WhatsApp
                  <span className="sr-only"> con {PROPERTY_EXECUTIVE.name} (abre en una pestaña nueva)</span>
                </a>
                <a
                  href={buildExecutiveCallUrl()}
                  className="flex h-12 items-center justify-center rounded-full border border-ink/25 px-5 font-semibold text-ink transition-colors duration-200 hover:border-ink hover:bg-paper"
                >
                  Llamar al {PROPERTY_EXECUTIVE.phone}
                </a>
                <a
                  href="#contact-title"
                  className="flex h-12 items-center justify-center rounded-full bg-accent px-5 font-bold text-on-accent shadow-soft transition-colors duration-200 hover:bg-accent-hover"
                >
                  Agendar visita
                </a>
              </div>
            </div>
          </div>

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
      <PropertyContactBar property={property} />
    </article>
  );
}
