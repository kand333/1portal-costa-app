import { CallToActionSection } from "@/components/home/call-to-action-section";
import { CommuneDial } from "@/components/home/commune-dial";
import { CommuneProvider } from "@/components/home/commune-context";
import { FaqSection } from "@/components/home/faq-section";
import { HeroSection } from "@/components/home/hero-section";
import { LeadSteps } from "@/components/home/lead-steps";
import { MobileCtaBar } from "@/components/home/mobile-cta-bar";
import { PropertyShowcaseSection } from "@/components/home/property-showcase-section";
import { COVERAGE_COMMUNES } from "@/lib/communes";
import { fetchPublishedCount } from "@/lib/published-count";

export default async function HomePage() {
  const publishedCount = await fetchPublishedCount();
  const facts = [
    ...(publishedCount ? [{ value: String(publishedCount), label: "propiedades publicadas" }] : []),
    { value: String(COVERAGE_COMMUNES.length), label: "comunas del Gran Concepción" },
    { value: "$0", label: "costo de la tasación" },
  ];

  return (
    <CommuneProvider>
      <HeroSection />
      <dl className="mx-auto mt-16 grid w-full max-w-7xl gap-6 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
        {facts.map((fact) => (
          <div key={fact.label} className="border-l border-brass pl-4">
            <dt className="sr-only">{fact.label}</dt>
            <dd>
              <span className="font-display text-4xl font-semibold text-ink">{fact.value}</span>
              <span className="ml-2 text-muted">{fact.label}</span>
            </dd>
          </div>
        ))}
      </dl>
      <LeadSteps />
      <CommuneDial />
      <PropertyShowcaseSection
        id="featured"
        title="Propiedades destacadas"
        description="Una selección de las mejores oportunidades del portal."
        query={{ featured: true, pageSize: 3 }}
        viewAllHref="/properties"
        viewAllLabel="Ver todas las propiedades"
      />
      <PropertyShowcaseSection
        id="for-sale"
        title="En venta"
        description="Las publicaciones más recientes para comprar."
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
