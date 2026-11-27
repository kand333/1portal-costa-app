import type { Metadata } from "next";
import { CallToActionSection } from "@/components/home/call-to-action-section";
import { CommuneDial } from "@/components/home/commune-dial";
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
import { fetchPropertiesFallback } from "@/lib/properties-server";
import { fetchPublishedCount } from "@/lib/published-count";
import { SITE_NAME } from "@/lib/property-metadata";

const FEATURED_QUERY = { featured: true, pageSize: 8 };

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
  const [saleCount, rentCount] = await Promise.all([
    fetchPublishedCount("SALE"),
    fetchPublishedCount("RENT"),
  ]);
  // The featured list is loaded here so its cards are in the first HTML; the same objects feed the client list below.
  const listsFallback = await fetchPropertiesFallback([FEATURED_QUERY]);
  return (
    <CommuneProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildRealEstateAgentSchema()) }} />
      <HeroSection />
      <PropertiesFallbackProvider fallback={listsFallback}>
        <PropertyShowcaseSection
          id="featured"
          title="Proyectos destacados"
          description="Una selección de los mejores proyectos y propiedades del Gran Concepción."
          query={FEATURED_QUERY}
          viewAllHref="/properties"
          viewAllLabel="Ver todas las propiedades"
          accentLastWord
        />
      </PropertiesFallbackProvider>
      <ShortcutTiles />
      <LeadSteps />
      <FreeValuationPitch />
      <MarketPanel sale={saleCount} rent={rentCount} />
      <CommuneDial />
      <FaqSection />
      <CallToActionSection />
      <MobileCtaBar />
    </CommuneProvider>
  );
}
