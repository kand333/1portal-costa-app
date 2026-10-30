import Link from "next/link";
import type { CSSProperties } from "react";
import { HeroBackdrop } from "@/components/home/hero-backdrop";
import { HeroParallax } from "@/components/home/hero-parallax";
import { HeroSearch } from "@/components/home/hero-search";

const glassButtonClassName =
  "inline-flex h-12 items-center rounded-full border border-white/50 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-md transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/20";

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
          className="absolute inset-x-0 bottom-0 h-24 w-full text-paper will-change-transform sm:h-36"
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
        className="mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pb-56 pt-36 sm:px-6 sm:pb-40 sm:pt-40 lg:px-8"
      >
        <p style={{ "--delay": "0s" } as CSSProperties} className="rise text-base text-white/90">
          Proyectos nuevos en venta
        </p>
        <h1
          id="hero-title"
          style={{ "--delay": "0.1s" } as CSSProperties}
          className="rise mt-3 max-w-3xl text-[clamp(2.1rem,5.4vw,4.5rem)] font-bold uppercase leading-[1.06] tracking-tight text-white"
        >
          Encuentra tu depto nuevo en el Gran Concepción
        </h1>
        <div style={{ "--delay": "0.25s" } as CSSProperties} className="rise">
          <HeroSearch resultCount={resultCount} />
        </div>
        <div style={{ "--delay": "0.4s" } as CSSProperties} className="rise mt-10 flex flex-wrap gap-3">
          <Link href="/#tasacion-gratis" className={glassButtonClassName}>
            Tasación gratuita
          </Link>
          <Link href="/#cierre" className={glassButtonClassName}>
            Corretaje tradicional
          </Link>
        </div>
      </section>
    </div>
  );
}
