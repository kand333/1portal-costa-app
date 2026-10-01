import { CallToActionSection } from "@/components/home/call-to-action-section";
import { HeroSection } from "@/components/home/hero-section";
import { PropertyShowcaseSection } from "@/components/home/property-showcase-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PropertyShowcaseSection
        id="featured"
        title="Propiedades destacadas"
        description="Una selección de las mejores oportunidades del portal."
        query={{ featured: true, pageSize: 6 }}
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
      <CallToActionSection />
    </>
  );
}
