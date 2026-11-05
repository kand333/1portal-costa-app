import Image from "next/image";
import Link from "next/link";
import { LeadForm } from "@/components/home/lead-form";
import { COMMUNE_NAMES } from "@/lib/communes";

// Test photo (Unsplash). Swap it here for the real one.
const BACKGROUND = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=2000&q=75";

// Houses and apartments have their own valuation page (also an internal link for search engines).
const SPECIALTIES: readonly { label: string; href?: string }[] = [
  { label: "Departamentos", href: "/tasacion/departamento/concepcion" },
  { label: "Casas", href: "/tasacion/casa/concepcion" },
  { label: "Terrenos" },
  { label: "Oficinas" },
];

/** The lead hook: a free valuation (sale price or rental price) with proof of experience and a short form beside it. */
export function FreeValuationPitch() {
  return (
    <section id="tasacion-gratis" aria-labelledby="pitch-title" className="night relative isolate scroll-mt-24 overflow-hidden">
      <Image src={BACKGROUND} alt="" fill sizes="100vw" className="-z-10 object-cover opacity-20" />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:items-start lg:gap-16 lg:px-8 lg:py-28">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-brass-text">Tasación gratuita</p>
          <h2 id="pitch-title" className="mt-5 font-display text-[clamp(2.25rem,4.6vw,4rem)] leading-[1.05] text-ink">
            Obtén tu tasación de venta o valoración de precio de arriendo profesional, de manera{" "}
            <span className="text-brass">gratuita</span> en Concepción
          </h2>
          <p className="mt-5 max-w-xl text-lg text-muted">Sin gastar tiempo, sin perder dinero, sin letra chica, sin preocupaciones.</p>

          <Link
            href="/regularizacion"
            className="group mt-10 flex items-center justify-between gap-6 border-y border-line py-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span>
              <span className="block font-display text-[clamp(1.5rem,3vw,2.25rem)] leading-tight text-brass">
                Asesoría en regularización de propiedades con problemas
              </span>
              <span className="mt-2 block text-sm text-muted">¿Tu propiedad tiene problemas para venderse? Conoce el camino.</span>
            </span>
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[image:var(--ember)] text-white transition-transform duration-300 group-hover:translate-x-1"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>

          <p className="mt-8 font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted">Especializados en</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SPECIALTIES.map((specialty) => (
              <li key={specialty.label}>
                {specialty.href ? (
                  <Link
                    href={specialty.href}
                    className="inline-flex min-h-11 items-center rounded-full border border-line px-4 py-1.5 text-sm font-medium text-ink transition-colors duration-200 hover:border-brass hover:text-brass-text"
                  >
                    {specialty.label}
                  </Link>
                ) : (
                  <span className="inline-flex min-h-11 items-center rounded-full border border-line px-4 py-1.5 text-sm font-medium text-ink">
                    {specialty.label}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <p className="mt-8 max-w-xl text-sm text-muted">* Aplica solamente para las comunas de {COMMUNE_NAMES.join(", ")}.</p>
        </div>

        <div className="tile-in rounded-[1.75rem] bg-surface p-6 text-ink shadow-lift sm:p-8">
          <h3 className="font-display text-3xl">Pide tu tasación gratis</h3>
          <div className="mt-6">
            <LeadForm source="home-hero" idPrefix="pitch-lead" fixedKind="VALUATION" />
          </div>
        </div>
      </div>
    </section>
  );
}
