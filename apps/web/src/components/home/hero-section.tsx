import Link from "next/link";
import type { CSSProperties } from "react";
import { HeroBackdrop } from "@/components/home/hero-backdrop";
import { HeroParallax } from "@/components/home/hero-parallax";
import { HeroSearch } from "@/components/home/hero-search";

const glassButtonClassName =
  "inline-flex h-16 items-center justify-center whitespace-nowrap rounded-full border border-white/50 bg-white/10 px-2.5 text-[0.8125rem] sm:justify-start sm:whitespace-normal sm:px-6 sm:text-sm font-semibold text-white backdrop-blur-md transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/20";

// Primary lead CTA: solid orange with dark ink text (AA contrast), larger than the glass buttons, with a soft pulsing halo.
const primaryButtonClassName =
  "cta-pulse group inline-flex h-16 items-center gap-3 whitespace-nowrap rounded-full bg-accent px-2.5 text-[0.8125rem] font-bold sm:whitespace-normal sm:pl-7 sm:pr-3 sm:text-base text-on-accent shadow-[0_14px_36px_-10px_rgb(245_105_8/0.75)] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

type HeroSectionProps = {
  /** Published properties for «Se han encontrado N resultados»; null when the API cannot answer. */
  resultCount: number | null;
};

export function HeroSection({ resultCount }: HeroSectionProps) {
  return (
    <div className="relative isolate -mt-[5.5rem] overflow-hidden bg-ink">
      <HeroParallax className="absolute inset-0 -z-10">
        <div data-depth="0.18" className="absolute inset-x-0 -top-10 bottom-0 will-change-transform">
          <HeroBackdrop />
        </div>
        {/* Scrim only where the text sits. */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/60 to-transparent" />
        {/* The nearest plane: a soft crest that hands over to the page. */}
        <svg
          data-depth="0.32"
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 w-full text-paper will-change-transform sm:h-36 lg:h-12"
        >
          <path
            d="M0 140C160 90 280 60 420 96C560 132 640 70 800 64C960 58 1080 120 1240 96C1340 80 1400 90 1440 100V220H0Z"
            fill="currentColor"
            opacity="0.22"
          />
          <path
            d="M0 180C200 140 340 120 520 150C700 180 820 120 1000 128C1180 136 1300 170 1440 150V220H0Z"
            fill="currentColor"
          />
        </svg>
      </HeroParallax>
      <section
        aria-labelledby="hero-title"
        className="mx-auto flex min-h-[calc(100svh-var(--top-bar-height))] max-w-7xl hero-fit-section flex-col justify-end px-4 pb-[5.75rem] pt-24 sm:px-6 sm:pt-40 lg:px-8 lg:pb-5"
      >
        <p style={{ "--delay": "0s" } as CSSProperties} className="rise text-base text-white/90">
          Corredora de propiedades en Concepción<span className="hidden sm:inline"> · Proyectos nuevos en venta</span>
        </p>
        <h1
          id="hero-title"
          style={{ "--delay": "0.1s" } as CSSProperties}
          className="hero-fit-title rise mt-3 max-w-3xl text-[clamp(2.1rem,5.4vw,4.5rem)] font-bold uppercase leading-[1.06] tracking-tight text-white"
        >
          Encuentra tu hogar ideal en el Gran Concepción
        </h1>
        <div style={{ "--delay": "0.25s" } as CSSProperties} className="rise">
          <HeroSearch resultCount={resultCount} />
        </div>
        <div style={{ "--delay": "0.4s" } as CSSProperties} className="rise mt-6 sm:mt-10 lg:flex lg:items-center lg:gap-6">
          <div className="grid grid-cols-2 gap-3 pr-[4.5rem] sm:flex sm:flex-wrap sm:items-center sm:gap-x-4 sm:pr-0">
          <Link href="/properties?operation=SALE" className={primaryButtonClassName}>
            <span className="flex flex-col text-left leading-tight">
              Proyectos nuevos
              <span className="text-xs font-medium">Entrega inmediata</span>
            </span>
            <span
              aria-hidden="true"
              className="hidden size-10 items-center justify-center rounded-full bg-ink sm:flex text-white transition-transform duration-300 group-hover:translate-x-1"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
          <Link href="/regularizacion" className={glassButtonClassName}>
            <span className="flex flex-col text-left leading-tight">
              Regularizaciones
              <span className="text-xs font-medium text-white/85">Equipo jurídico</span>
            </span>
          </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
