import type { Metadata } from "next";
import { PropertyValuator } from "@/components/tasador/property-valuator";
import { ValuationFaq } from "@/components/tasador/valuation-faq";
import { BRAND_SHARE_IMAGE } from "@/lib/brand-share-image";
import { SITE_NAME } from "@/lib/property-metadata";

const title = `Tasación de propiedades gratis en Concepción | ${SITE_NAME}`;
const description = "Estima gratis el precio de venta o arriendo de tu casa o departamento en Concepción y alrededores.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/tasador-propiedades" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "es_CL",
    url: "/tasador-propiedades",
    title,
    description,
    images: [BRAND_SHARE_IMAGE],
  },
};

export default function PropertyValuationPage() {
  return (
    <>
      <section aria-labelledby="valuation-title" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <h1 id="valuation-title" className="text-center text-2xl font-semibold text-ink">
          Tasación de propiedades gratis y online en Concepción y alrededores
        </h1>
        <div className="mx-auto mt-6 flex max-w-4xl gap-3">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-1 size-5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
          </svg>
          <p className="text-lg leading-relaxed text-ink">
            Conoce cuánto vale tu casa o departamento en Concepción y alrededores. Nuestro tasador gratuito compara tu
            propiedad con las publicadas en el portal y te muestra un precio y un rango en segundos, antes de vender,
            comprar o arrendar.
          </p>
        </div>
        <div className="mt-10">
          <PropertyValuator />
        </div>
      </section>
      <ValuationFaq />
    </>
  );
}
