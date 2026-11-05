import type { Metadata } from "next";
import Link from "next/link";
import { BlueprintArt } from "@/components/regularizacion/blueprint-art";
import { ProblemExplorer } from "@/components/regularizacion/problem-explorer";
import { BRAND_SHARE_IMAGE } from "@/lib/brand-share-image";
import { SITE_NAME } from "@/lib/property-metadata";
import { buildRegularizationUrl } from "@/lib/regularization";

const title = `Regularización de propiedades en Concepción | ${SITE_NAME}`;
const description =
  "¿Casa sin escritura, ampliación sin permiso o herencia sin inscribir? Entiende el problema y el camino para venderla en el Gran Concepción.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/regularizacion" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "es_CL",
    url: "/regularizacion",
    title,
    description,
    images: [BRAND_SHARE_IMAGE],
  },
};

const SHORTCUTS = [
  { href: "/tasador-propiedades", title: "Tasar mi propiedad", text: "Conoce su valor en minutos, gratis." },
  { href: "/properties?operation=SALE", title: "Comprar", text: "Revisa proyectos y propiedades en venta." },
  { href: "/#tasacion-gratis", title: "Vender con una corredora", text: "Pide tu tasación y hablamos de cómo venderla." },
] as const;

const QUESTIONS = [
  {
    question: "¿Puedo vender una propiedad con problemas de papeles?",
    answer:
      "Depende del problema. Algunos se resuelven antes de publicar y otros pueden tratarse durante la venta. Cuéntanos tu caso y te orientamos sobre el orden de los pasos.",
  },
  {
    question: "¿PropiZoom hace los trámites legales?",
    answer:
      "Somos corredores de propiedades y contamos con un equipo jurídico. Te explicamos el camino y qué se necesita; nuestro equipo jurídico revisa los trámites según tu caso.",
  },
  {
    question: "¿Cuánto demora regularizar?",
    answer:
      "Cada caso es distinto y depende de la municipalidad, del Conservador de Bienes Raíces y de los antecedentes que tengas. Por eso no prometemos plazos antes de conocer tu situación.",
  },
  {
    question: "¿Qué debo llevar a la primera conversación?",
    answer:
      "Si los tienes: la escritura, el certificado de dominio vigente, el último avalúo fiscal y los planos. Si no tienes alguno, igual escríbenos.",
  },
] as const;

export default function RegularizationPage() {
  const consultationUrl = buildRegularizationUrl(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);

  return (
    <>
      <section aria-labelledby="regularization-title" className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-8 lg:pb-24 lg:pt-20">
        <div>
          <h1 id="regularization-title" className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[1.02] text-ink">
            ¿Tu propiedad tiene problemas para venderse? Te mostramos el camino.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Casa sin escritura, ampliación sin permiso, herencia sin inscribir. Elige qué le pasa a la tuya y ve qué significa, por
            qué frena la venta y cuál es el camino habitual.
          </p>
          <a
            href="#explorador"
            className="cta-pulse mt-8 inline-flex min-h-12 items-center rounded-lg bg-accent px-6 font-bold text-on-accent shadow-soft transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-accent-hover"
          >
            Elegir mi caso
          </a>
        </div>
        <BlueprintArt />
      </section>

      <section id="explorador" aria-labelledby="explorer-title" className="scroll-mt-24 border-y border-line bg-sand">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <h2 id="explorer-title" className="font-display text-3xl text-ink sm:text-5xl">
            ¿Qué le pasa a tu propiedad?
          </h2>
          <div className="mt-10">
            <ProblemExplorer />
          </div>
        </div>
      </section>

      <section aria-labelledby="shortcuts-title" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <h2 id="shortcuts-title" className="font-display text-3xl text-ink sm:text-5xl">
          ¿Qué quieres hacer?
        </h2>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.href} className="tile-in">
              <Link
                href={shortcut.href}
                className="group flex h-full min-h-44 flex-col justify-between gap-6 rounded-[1.75rem] border border-line bg-surface p-6 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span>
                  <span className="block font-display text-3xl text-ink">{shortcut.title}</span>
                  <span className="mt-2 block text-muted">{shortcut.text}</span>
                </span>
                <span
                  aria-hidden="true"
                  className="flex size-12 items-center justify-center self-end rounded-full bg-[image:var(--ember)] text-white transition-transform duration-300 group-hover:translate-x-1"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="invite-title" className="bg-[image:var(--ember)] text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <h2 id="invite-title" className="font-display text-3xl sm:text-5xl">
              Conversemos tu caso
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-white/90">
              Te orientamos sobre el camino y los documentos que necesitas. Nuestro equipo jurídico revisa los trámites según tu caso.
            </p>
          </div>
          <a
            href={consultationUrl ?? "/tasador-propiedades"}
            {...(consultationUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="inline-flex min-h-12 shrink-0 items-center rounded-lg bg-white px-6 font-bold text-ink shadow-soft transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {consultationUrl ? "Escribir por WhatsApp" : "Pedir tasación gratis"}
          </a>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <h2 id="faq-title" className="font-display text-3xl text-ink sm:text-5xl">
          Preguntas frecuentes
        </h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {QUESTIONS.map((item) => (
            <details key={item.question} className="group py-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
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
    </>
  );
}
