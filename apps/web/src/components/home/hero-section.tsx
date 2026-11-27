import Link from "next/link";
import type { CSSProperties } from "react";
import { HeroBackdrop } from "@/components/home/hero-backdrop";
import { HeroParallax } from "@/components/home/hero-parallax";
import { HeroSearch } from "@/components/home/hero-search";
import { AccentWord } from "@/components/ui/accent-word";

// Secondary CTA: translucent blue glass, text centred; a third narrower on phones.
const glassButtonClassName =
  "group inline-flex h-16 w-[8.5625rem] flex-none items-center justify-center rounded-full border border-brand-blue/70 bg-brand-blue/45 px-3 text-center text-[0.8125rem] font-semibold leading-tight text-white shadow-[0_10px_30px_-12px_rgb(46_100_181/0.85),inset_0_1px_0_rgb(255_255_255/0.25)] backdrop-blur-md transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-brand-blue/60 hover:shadow-[0_14px_36px_-10px_rgb(46_100_181/0.95),inset_0_1px_0_rgb(255_255_255/0.35)]";

// Primary lead CTA: solid orange with dark ink text (AA contrast), larger than the glass buttons, with a soft pulsing halo.
const primaryButtonClassName =
  "cta-pulse group inline-flex h-16 shrink-0 items-center gap-3 whitespace-nowrap rounded-full bg-accent pl-7 pr-3 text-base font-bold text-on-accent shadow-[0_14px_36px_-10px_rgb(245_105_8/0.75)] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

export function HeroSection() {
  return (
    <div className="relative isolate -mt-[5.5rem] overflow-hidden bg-night">
      <HeroParallax className="absolute inset-0 -z-10">
        <div data-depth="0.18" className="absolute inset-x-0 -top-10 bottom-0 will-change-transform">
          <HeroBackdrop />
        </div>
        {/* Scrim only where the text sits. */}
        <div className="absolute inset-0 bg-gradient-to-r from-night/75 via-night/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-night/60 to-transparent" />
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
          Corredora de propiedades en Concepción
        </p>
        <h1
          id="hero-title"
          style={{ "--delay": "0.1s" } as CSSProperties}
          className="hero-fit-title rise mt-3 max-w-3xl text-[clamp(2.1rem,5.4vw,4.5rem)] font-display display-heavy leading-[1.04] text-white"
        >
          Encuentra tu hogar ideal en el <AccentWord>Gran Concepción</AccentWord>
        </h1>
        <div style={{ "--delay": "0.25s" } as CSSProperties} className="rise">
          <HeroSearch />
        </div>
        <div style={{ "--delay": "0.4s" } as CSSProperties} className="rise mt-6 sm:mt-10 lg:flex lg:items-center lg:gap-6">
          {/* The same two buttons as on PC; on narrow phones the row is scaled down (zoom) so both fit side by side. */}
          <div className="flex flex-nowrap items-center gap-4 [zoom:0.88] min-[380px]:[zoom:0.95] min-[400px]:[zoom:1] sm:flex-wrap">
          <Link href="/properties?operation=SALE" className={primaryButtonClassName}>
            Ver Propiedades
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-night text-white transition-transform duration-300 group-hover:translate-x-1"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
          <Link href="/regularizacion" className={glassButtonClassName}>
            <span className="flex flex-col items-center text-center">
              <span>¿Quieres</span>
              <span>Regularizar?</span>
            </span>
          </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
