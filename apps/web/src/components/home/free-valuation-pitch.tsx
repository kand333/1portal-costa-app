import Image from "next/image";
import { CountUp } from "@/components/home/count-up";
import { LeadForm } from "@/components/home/lead-form";
import { COMMUNE_NAMES } from "@/lib/communes";

// Test photo (Unsplash). Swap it here for the real one.
const BACKGROUND = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=2000&q=75";

// Credentials shown to visitors; real figures of the business, kept here so they are easy to update.
const CREDENTIALS = [
  { value: 14, label: "años de experiencia" },
  { value: 500, label: "negocios realizados" },
  { value: 1000, label: "tasaciones" },
] as const;

const SPECIALTIES = ["Departamentos", "Casas", "Terrenos", "Oficinas"] as const;

/** The lead hook: a free valuation (sale price or rental price) with proof of experience and a short form beside it. */
export function FreeValuationPitch() {
  return (
    <section id="tasacion-gratis" aria-labelledby="pitch-title" className="night relative isolate scroll-mt-24 overflow-hidden">
      <Image src={BACKGROUND} alt="" fill sizes="100vw" className="-z-10 object-cover opacity-20" />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:items-start lg:gap-16 lg:px-8 lg:py-28">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-brass-text">Tasación gratuita</p>
          <h2 id="pitch-title" className="mt-5 font-display text-[clamp(2.25rem,4.6vw,4rem)] leading-[1.05] text-ink">
            Obtén tu tasación de venta o valoración de precio de arriendo profesional, de manera gratuita
          </h2>
          <p className="mt-5 max-w-xl text-lg text-muted">Sin gastar tiempo, sin perder dinero, sin letra chica, sin preocupaciones.</p>

          <dl className="mt-10 grid grid-cols-3 gap-4 border-y border-line py-8">
            {CREDENTIALS.map((item) => (
              <div key={item.label}>
                <dt className="sr-only">{item.label}</dt>
                <dd>
                  <span className="block font-display text-[clamp(2rem,5vw,3.75rem)] leading-none text-brass lining-nums tabular-nums">
                    <CountUp value={item.value} suffix="+" />
                  </span>
                  <span className="mt-2 block text-sm text-muted">{item.label}</span>
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted">Especializados en</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SPECIALTIES.map((specialty) => (
              <li key={specialty} className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-ink">
                {specialty}
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
