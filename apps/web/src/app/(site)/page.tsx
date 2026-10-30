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
import { COVERAGE_COMMUNES } from "@/lib/communes";
import { fetchPublishedCount } from "@/lib/published-count";

export default async function HomePage() {
  const [publishedCount, saleCount, rentCount] = await Promise.all([
    fetchPublishedCount(),
    fetchPublishedCount("SALE"),
    fetchPublishedCount("RENT"),
  ]);
  const facts = [
    ...(publishedCount ? [{ value: publishedCount, prefix: "", label: "propiedades publicadas" }] : []),
    { value: COVERAGE_COMMUNES.length, prefix: "", label: "comunas del Gran Concepción" },
    { value: 0, prefix: "$", label: "costo de la tasación" },
  ];

  return (
    <CommuneProvider>
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
      <PropertyShowcaseSection
        id="featured"
        title="Proyectos destacados"
        description="Una selección de los mejores proyectos y propiedades del Gran Concepción."
        query={{ featured: true, pageSize: 3 }}
        viewAllHref="/properties"
        viewAllLabel="Ver todas las propiedades"
      />
      <PropertyShowcaseSection
        id="for-sale"
        title="Nuevas en venta"
        description="Las publicaciones más recientes para comprar tu próximo hogar."
        query={{ operation: "SALE", pageSize: 3 }}
        viewAllHref="/properties?operation=SALE"
        viewAllLabel="Ver todas en venta"
      />
      <PropertyShowcaseSection
        id="for-rent"
        title="En arriendo"
        description="Las publicaciones más recientes para arrendar."
        query={{ operation: "RENT", pageSize: 3 }}
        viewAllHref="/properties?operation=RENT"
        viewAllLabel="Ver todas en arriendo"
      />
      <FaqSection />
      <CallToActionSection />
      <MobileCtaBar />
    </CommuneProvider>
  );
}
