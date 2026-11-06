import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RelatedGuides } from "@/components/guides/related-guides";
import { PropertyShowcaseSection } from "@/components/home/property-showcase-section";
import { PropertiesFallbackProvider } from "@/components/properties/properties-fallback";
import { countLandingProperties, isLandingIndexable } from "@/lib/landing-availability";
import { buildPropertiesApiUrl } from "@/lib/property-search";
import { fetchPropertiesFallback } from "@/lib/properties-server";
import { serializeJsonLd } from "@/lib/agent-schema";
import { BRAND_SHARE_IMAGE } from "@/lib/brand-share-image";
import { SITE_NAME } from "@/lib/property-metadata";
import { siteUrl } from "@/lib/site-url";
import {
  getValuationLanding,
  listValuationLandings,
  valuationLandingDescription,
  valuationLandingTitle,
} from "@/lib/valuation-landing";

// Only the listed type + commune pairs exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return listValuationLandings().map((landing) => ({ tipo: landing.typeSlug, comuna: landing.communeSlug }));
}

export async function generateMetadata({ params }: PageProps<"/tasacion/[tipo]/[comuna]">): Promise<Metadata> {
  const { tipo, comuna } = await params;
  const landing = getValuationLanding(tipo, comuna);
  if (!landing) return { title: `Página no encontrada | ${SITE_NAME}` };
  const title = valuationLandingTitle(landing);
  const description = valuationLandingDescription(landing);
  // Without real properties for this type and commune the page would nearly copy its siblings: keep it out of Google.
  const indexable = isLandingIndexable(await countLandingProperties(landing));
  return {
    title,
    description,
    alternates: { canonical: landing.path },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "es_CL",
      url: landing.path,
      title,
      description,
      images: [BRAND_SHARE_IMAGE],
    },
  };
}

const ctaClassName =
  "inline-flex h-14 items-center rounded-full bg-accent px-8 text-base font-bold text-on-accent shadow-soft transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-accent-hover";

export default async function ValuationLandingPage({ params }: PageProps<"/tasacion/[tipo]/[comuna]">) {
  const { tipo, comuna } = await params;
  const landing = getValuationLanding(tipo, comuna);
  if (!landing) notFound();

  const { commune, singular, plural } = landing;
  // Same object for the server fetch and the client list, so both use the same cache key.
  const showcaseQuery = { city: [commune.citySlug], type: landing.propertyType, pageSize: 3 };
  const fallback = await fetchPropertiesFallback([showcaseQuery]);
  // Same commune in the other property type, and the same type in the other communes, only while they have properties.
  const siblings = listValuationLandings().filter(
    (other) => other.path !== landing.path && (other.communeSlug === landing.communeSlug || other.typeSlug === landing.typeSlug),
  );
  const siblingCounts = await Promise.all(siblings.map((other) => countLandingProperties(other)));
  const otherLandings = siblings.filter((_, index) => isLandingIndexable(siblingCounts[index]));
  const listed = fallback[buildPropertiesApiUrl(showcaseQuery)];
  const sectors = [...new Set((listed?.data ?? []).map((property) => property.commune))].slice(0, 3);
  const origin = siteUrl();
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: origin },
      { "@type": "ListItem", position: 2, name: "Tasación", item: `${origin}/tasador-propiedades` },
      { "@type": "ListItem", position: 3, name: `${plural} en ${commune.name}`, item: `${origin}${landing.path}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Static data from this repository, with "<" escaped so it cannot close the tag.
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbs) }}
      />
      <article className="mx-auto w-full max-w-4xl px-4 pb-8 pt-10 sm:px-6">
        <nav aria-label="Ruta de navegación" className="text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-ink">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/tasador-propiedades" className="hover:text-ink">
                Tasación
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              {plural} en {commune.name}
            </li>
          </ol>
        </nav>

        <h1 className="mt-6 font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] text-ink">
          Tasación de {plural} en {commune.name}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          ¿Cuánto vale tu {singular} en {commune.name}? Nuestro tasador gratuito compara tu propiedad con las publicadas en
          el Gran Concepción y te muestra un precio y un rango en segundos. Después, una corredora local puede revisarlo
          contigo, sin costo ni compromiso.
        </p>
        <div className="mt-8">
          <Link href="/tasador-propiedades" className={ctaClassName}>
            Tasar mi {singular} gratis
          </Link>
        </div>

        {listed && listed.meta.total > 0 && (
          <p className="mt-6 text-muted">
            Hoy hay {listed.meta.total} {plural} publicadas en {commune.name}
            {sectors.length > 0 ? `, por ejemplo en ${sectors.join(", ")}` : ""}.
          </p>
        )}

        <h2 className="mt-14 text-2xl font-semibold text-ink">
          Qué influye en el valor de {landing.article} {singular} en {commune.name}
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted">
          {landing.factors.map((factor) => (
            <li key={factor}>{factor}</li>
          ))}
        </ul>

        <h2 className="mt-12 text-2xl font-semibold text-ink">Cómo funciona la tasación gratuita</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted">
          <li>Indicas la dirección y los datos de tu {singular}.</li>
          <li>Comparamos con propiedades parecidas publicadas en el portal.</li>
          <li>Recibes un precio y un rango orientativos, y puedes pedir que una corredora lo revise.</li>
        </ol>
        <p className="mt-4 text-sm text-muted">
          La estimación es referencial y no reemplaza una tasación bancaria presencial.
        </p>
      </article>

      <PropertiesFallbackProvider fallback={fallback}>
        <PropertyShowcaseSection
          id={`${landing.typeSlug}-${landing.communeSlug}`}
          title={`${plural.charAt(0).toUpperCase()}${plural.slice(1)} ${landing.published} en ${commune.name}`}
          description="Referencia de lo que hoy se ofrece en la zona."
          query={showcaseQuery}
          viewAllHref={`/properties?city=${commune.citySlug}&type=${landing.propertyType}`}
          viewAllLabel={`Ver ${landing.all} ${plural}`}
        />
      </PropertiesFallbackProvider>

      <RelatedGuides sections={["tasacion-compra"]} className="mx-auto w-full max-w-4xl px-4 pb-10 sm:px-6" />

      {otherLandings.length > 0 && (
        <nav aria-label="Otras tasaciones" className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
          <h2 className="text-lg font-semibold text-ink">También puede interesarte</h2>
          <ul className="mt-3 space-y-2">
            {otherLandings.map((other) => (
              <li key={other.path}>
                <Link href={other.path} className="font-medium text-brass-text underline underline-offset-4">
                  Tasación de {other.plural} en {other.commune.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
