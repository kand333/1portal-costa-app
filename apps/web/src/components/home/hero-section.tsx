import Image from "next/image";
import type { CSSProperties } from "react";
import { HeroParallax } from "@/components/home/hero-parallax";
import { LeadForm } from "@/components/home/lead-form";
import { PointerGlow } from "@/components/ui/pointer-glow";
import { PropertySearchForm } from "@/components/properties/property-search-form";

export function HeroSection() {
  return (
    <>
      <PointerGlow className="relative isolate overflow-hidden bg-[#0e1213]">
        <HeroParallax className="absolute inset-0 -z-10">
          <div data-depth="0.18" className="absolute inset-x-0 -top-10 bottom-0 will-change-transform">
            <Image
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80"
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
              preload
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e1213]/90 via-[#0e1213]/55 to-[#0e1213]/20" />
          {/* Hills and river of the Biobío, a nearer plane that drifts faster than the photo. */}
          <svg
            data-depth="0.32"
            viewBox="0 0 1440 220"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-40 w-full text-paper will-change-transform sm:h-56"
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
        <div className="glow-spot -z-10" aria-hidden="true" />
        <section
          aria-labelledby="hero-title"
          className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-32 pt-20 sm:px-6 lg:min-h-[40rem] lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:px-8 lg:pb-40"
        >
          <div className="max-w-2xl text-white">
            <h1
              id="hero-title"
              style={{ "--delay": "0.1s" } as CSSProperties}
              className="rise font-display text-[clamp(2.75rem,6.5vw,5rem)] font-semibold leading-[1.02] tracking-tight"
            >
              ¿Cuánto vale tu propiedad en Concepción?
            </h1>
            <p
              style={{ "--delay": "0.25s" } as CSSProperties}
              className="rise mt-6 max-w-xl text-lg leading-relaxed text-white/80"
            >
              Tasación gratuita para casas, departamentos y terrenos de Concepción, San Pedro de la Paz, Chiguayante,
              Talcahuano y alrededores. Déjanos tu dirección y te contactamos.
            </p>
          </div>
          <div
            id="tasar"
            style={{ "--delay": "0.4s" } as CSSProperties}
            className="rise scroll-mt-24 rounded-[1.5rem] border border-white/50 bg-surface/90 p-5 shadow-lift backdrop-blur-2xl sm:p-6 dark:border-white/10"
          >
            <LeadForm source="home-hero" idPrefix="hero-lead" />
          </div>
        </section>
      </PointerGlow>
      {/* Buyers get their own route: the search bar floats over the lower edge of the hero. */}
      <div
        style={{ "--delay": "0.55s" } as CSSProperties}
        className="rise relative z-10 mx-auto -mt-12 w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <PropertySearchForm />
      </div>
    </>
  );
}
