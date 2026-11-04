import type { Metadata } from "next";
import { CallToActionSection } from "@/components/home/call-to-action-section";
import { CommuneDial } from "@/components/home/commune-dial";
import { CountUp } from "@/components/home/count-up";
import { CommuneProvider } from "@/components/home/commune-context";
import { FaqSection } from "@/components/home/faq-section";
import { HeroSection } from "@/components/home/hero-section";
import { LeadSteps } from "@/components/home/lead-steps";
import { MobileCtaBar } from "@/components/home/mobile-cta-bar";
import { ShortcutTiles } from "@/components/home/shortcut-tiles";
import { MarketPanel } from "@/components/home/market-panel";
import { FreeValuationPitch } from "@/components/home/free-valuation-pitch";
import { PropertyShowcaseSection } from "@/components/home/property-showcase-section";
import { PropertiesFallbackProvider } from "@/components/properties/properties-fallback";
import { buildRealEstateAgentSchema, serializeJsonLd } from "@/lib/agent-schema";
import { BRAND_SHARE_IMAGE } from "@/lib/brand-share-image";
import { COVERAGE_COMMUNES } from "@/lib/communes";
import { fetchPropertiesFallback } from "@/lib/properties-server";
import { fetchPublishedCount } from "@/lib/published-count";
import { SITE_NAME } from "@/lib/property-metadata";

const FEATURED_QUERY = { featured: true, pageSize: 3 };
const SALE_QUERY = { operation: "SALE" as const, pageSize: 3 };
const RENT_QUERY = { operation: "RENT" as const, pageSize: 3 };

const title = `${SITE_NAME} | Tasación gratis y corretaje de propiedades en Concepción`;
const description =
  "Corredora de propiedades en el Gran Concepción: tasación gratuita de tu casa o departamento, proyectos nuevos en venta y corretaje tradicional.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "es_CL", url: "/", title, description, images: [BRAND_SHARE_IMAGE] },
};

export default async function HomePage() {
  const [publishedCount, saleCount, rentCount] = await Promise.all([
    fetchPublishedCount(),
    fetchPublishedCount("SALE"),
    fetchPublishedCount("RENT"),
  ]);
  // The three lists are loaded here so their cards are in the first HTML; the same objects feed the client lists below.
  const listsFallback = await fetchPropertiesFallback([FEATURED_QUERY, SALE_QUERY, RENT_QUERY]);
  const facts = [
    ...(publishedCount ? [{ value: publishedCount, prefix: "", label: "propiedades publicadas" }] : []),
    { value: COVERAGE_COMMUNES.length, prefix: "", label: "comunas del Gran Concepción" },
    { value: 0, prefix: "$", label: "costo de la tasación" },
  ];

  return (
    <CommuneProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildRealEstateAgentSchema()) }} />
      <HeroSection resultCount={publishedCount} />
      <ShortcutTiles />
      <div className="night -mt-px border-b-4 border-brass">
      <dl className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
        {facts.map((fact) => (
          <div key={fact.label} className="border-l border-brass pl-4">
            <dt className="sr-only">{fact.label}</dt>
            <dd>
              <span className="font-display text-5xl font-semibold lining-nums tabular-nums text-brass">
                <CountUp value={fact.value} prefix={fact.prefix} />
              </span>
              <span className="ml-2 text-muted">{fact.label}</span>
            </dd>
          </div>
        ))}
      </dl>
      </div>
      <LeadSteps />
      <FreeValuationPitch />
      <MarketPanel sale={saleCount} rent={rentCount} />
      <CommuneDial />
      <PropertiesFallbackProvider fallback={listsFallback}>
      <PropertyShowcaseSection
        id="featured"
        title="Proyectos destacados"
        description="Una selección de los mejores proyectos y propiedades del Gran Concepción."
        query={FEATURED_QUERY}
        viewAllHref="/properties"
        viewAllLabel="Ver todas las propiedades"
      />
      <PropertyShowcaseSection
        id="for-sale"
        title="Nuevas en venta"
        description="Las publicaciones más recientes para comprar tu próximo hogar."
        query={SALE_QUERY}
        viewAllHref="/properties?operation=SALE"
        viewAllLabel="Ver todas en venta"
      />
      <PropertyShowcaseSection
        id="for-rent"
        title="En arriendo"
        description="Las publicaciones más recientes para arrendar."
        query={RENT_QUERY}
        viewAllHref="/properties?operation=RENT"
        viewAllLabel="Ver todas en arriendo"
      />
      </PropertiesFallbackProvider>
      <FaqSection />
      <CallToActionSection />
      <MobileCtaBar />
    </CommuneProvider>
  );
}
