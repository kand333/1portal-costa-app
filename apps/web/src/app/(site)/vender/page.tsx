import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buildWhatsAppUrl } from "@/components/layout/whatsapp-button";
import { MobileCtaBar } from "@/components/home/mobile-cta-bar";
import { SellLeadForm } from "@/components/home/sell-lead-form";
import { PropertyShowcaseSection } from "@/components/home/property-showcase-section";
import { PropertiesFallbackProvider } from "@/components/properties/properties-fallback";
import { serializeJsonLd } from "@/lib/agent-schema";
import { BRAND_SHARE_IMAGE } from "@/lib/brand-share-image";
import { COVERAGE_COMMUNES } from "@/lib/communes";
import { fetchPropertiesFallback } from "@/lib/properties-server";
import { fetchPublishedCount } from "@/lib/published-count";
import { SITE_NAME } from "@/lib/property-metadata";
import { siteUrl } from "@/lib/site-url";

const title = `Vender tu propiedad en Concepción | ${SITE_NAME}`;
const description =
  "Vende tu casa o departamento en el Gran Concepción con una corredora: tasación gratis, fotografía profesional, publicación en portales y gestión hasta la escritura.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/vender" },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "es_CL", url: "/vender", title, description, images: [BRAND_SHARE_IMAGE] },
};

// Test photo (Unsplash), the same family as the rest of the site. Swap it here for the real one.
const HERO_PHOTO = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80";

const SALE_QUERY = { operation: "SALE" as const, pageSize: 3 };

const STEPS = [
  {
    title: "Tasamos tu propiedad",
    text: "Nos cuentas dónde está y cómo es, y te decimos en cuánto conviene publicarla. Es gratis y no te compromete a nada.",
  },
  {
    title: "La mostramos bien",
    text: "Fotografía profesional y publicación en portales inmobiliarios, para que la vean quienes de verdad buscan una propiedad como la tuya.",
  },
  {
    title: "Cerramos la venta",
    text: "Filtramos a los interesados, coordinamos las visitas y llevamos la promesa, la notaría y el Conservador hasta la entrega.",
  },
] as const;

const QUESTIONS = [
  {
    question: "¿Cuánto cuesta empezar?",
    answer: "La tasación es gratis. Las condiciones del corretaje se conversan contigo y quedan por escrito antes de publicar.",
  },
  {
    question: "¿Y si mi propiedad tiene problemas de papeles?",
    answer:
      "Muchos casos se pueden vender igual: escritura sin inscribir, ampliaciones sin permiso o herencias pendientes. Cuéntanos tu situación y te explicamos el orden de los pasos.",
  },
  {
    question: "¿Cuánto demora en venderse?",
    answer:
      "Depende del precio, de la zona y del estado de la propiedad, así que no prometemos plazos. Sí te damos un precio de publicación pensado para venderla.",
  },
  {
    question: "¿Qué necesito para partir?",
    answer: "Solo la dirección, el tipo de propiedad y tus datos de contacto. Los documentos los vemos después, juntos.",
  },
] as const;

export default async function SellPage() {
  const [publishedCount, listsFallback] = await Promise.all([fetchPublishedCount(), fetchPropertiesFallback([SALE_QUERY])]);
  const origin = siteUrl();
  const whatsappUrl = buildWhatsAppUrl(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER, "Hola, quiero vender mi propiedad con PropiZoom.");
  const facts = [
    ...(publishedCount ? [{ value: String(publishedCount), label: "propiedades publicadas hoy" }] : []),
    { value: String(COVERAGE_COMMUNES.length), label: "comunas del Gran Concepción" },
    { value: "$0", label: "costo de la tasación" },
    { value: "Equipo jurídico", label: "para los papeles de tu propiedad" },
  ];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Venta de propiedades con corredora",
      description,
      serviceType: "Corretaje de propiedades",
      provider: { "@type": "RealEstateAgent", name: SITE_NAME, url: origin },
      areaServed: { "@type": "AdministrativeArea", name: "Gran Concepción" },
      url: `${origin}/vender`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: origin },
        { "@type": "ListItem", position: 2, name: "Vender tu propiedad", item: `${origin}/vender` },
      ],
    },
  ];

  return (
    <>
      {jsonLd.map((entry, index) => (
        <script
          key={index}
          type="application/ld+json"
          // Static data from this repository, with "<" escaped so it cannot close the tag.
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(entry) }}
        />
      ))}

      <section aria-labelledby="sell-title" className="relative isolate overflow-hidden bg-night text-white">
        <Image src={HERO_PHOTO} alt="" fill sizes="100vw" className="-z-20 object-cover" priority />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-night/90 via-night/70 to-night/30" />
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16 lg:px-8 lg:py-20">
          <div>
            <p className="text-lg font-medium text-white/85">Propietarios del Gran Concepción</p>
            <h1 id="sell-title" className="mt-3 font-display text-[clamp(2.75rem,6vw,5.25rem)] leading-[1.02]">
              ¿Quieres vender tu propiedad?
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/90">
              Te decimos cuánto vale, la mostramos bien y nos encargamos de la promesa, la notaría y el Conservador. Tú decides; del
              resto nos ocupamos nosotros.
            </p>
          </div>
          <div id="vender-form" className="scroll-mt-28 rounded-[1.75rem] bg-surface p-6 text-ink shadow-lift sm:p-8">
            <h2 className="font-display text-3xl">Quiero vender mi propiedad</h2>
            <p className="mt-2 text-sm text-muted">Cuéntanos de tu propiedad y te escribimos por WhatsApp.</p>
            <div className="mt-6">
              <SellLeadForm idPrefix="sell" />
            </div>
          </div>
        </div>
      </section>

      <section aria-label="PropiZoom en cifras" className="border-y border-line bg-surface">
        <dl className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {facts.map((fact) => (
            <div key={fact.label} className="border-l border-brass pl-4">
              <dt className="sr-only">{fact.label}</dt>
              <dd>
                <span className="font-display text-4xl font-semibold lining-nums text-brass-text">{fact.value}</span>
                <span className="mt-1 block text-sm text-muted">{fact.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="how-title" className="bg-sand">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <h2 id="how-title" className="font-display text-4xl text-ink sm:text-5xl">
            Así vendemos tu propiedad, paso a paso
          </h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-[1.75rem] border border-line/70 bg-surface p-8 shadow-lift">
                <span aria-hidden="true" className="font-display text-5xl font-semibold lining-nums text-brass">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-xl font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <PropertiesFallbackProvider fallback={listsFallback}>
        <PropertyShowcaseSection
          id="vitrina"
          title="Así mostramos lo que vendemos"
          description="Cada propiedad con fotos reales, ficha completa y mapa. Así se verá la tuya."
          query={SALE_QUERY}
          viewAllHref="/properties?operation=SALE"
          viewAllLabel="Ver todas en venta"
        />
      </PropertiesFallbackProvider>

      <section aria-labelledby="legal-title" className="bg-[image:var(--ember)] text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <h2 id="legal-title" className="font-display text-3xl sm:text-4xl">
              ¿Tu propiedad tiene problemas de papeles?
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-white/90">
              Ley del Mono, posesión efectiva, herencias con varios herederos: se pueden resolver, y muchas veces mientras la vendes.
            </p>
          </div>
          <Link
            href="/regularizacion"
            className="inline-flex h-12 shrink-0 items-center self-start rounded-full bg-accent px-7 font-semibold text-on-accent shadow-soft transition-transform duration-200 hover:-translate-y-0.5 lg:self-auto"
          >
            Ver cómo regularizar
          </Link>
        </div>
      </section>

      <section aria-labelledby="sell-faq-title" className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <h2 id="sell-faq-title" className="font-display text-3xl text-ink sm:text-5xl">
          Preguntas frecuentes
        </h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {QUESTIONS.map((item) => (
            <details key={item.question} className="group py-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {item.question}
                <span aria-hidden="true" className="text-2xl text-brass transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 leading-relaxed text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="sell-close-title" className="border-t border-line bg-sand">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <h2 id="sell-close-title" className="max-w-xl font-display text-3xl text-ink sm:text-4xl">
            Cuéntanos qué quieres vender y partimos por la tasación
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tasador-propiedades"
              className="inline-flex h-12 items-center rounded-full bg-[image:var(--ember)] px-7 font-semibold text-white shadow-soft transition-transform duration-200 hover:-translate-y-0.5"
            >
              Tasar gratis
            </Link>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center rounded-full border border-ink/25 px-7 font-semibold text-ink transition-colors duration-200 hover:border-ink hover:bg-surface"
              >
                Escribir por WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>
      <MobileCtaBar href="#vender-form" />
    </>
  );
}
