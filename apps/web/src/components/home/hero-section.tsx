import Image from "next/image";
import type { CSSProperties } from "react";
import { PointerGlow } from "@/components/ui/pointer-glow";
import { PropertySearchForm } from "@/components/properties/property-search-form";

export function HeroSection() {
  return (
    <>
      <PointerGlow className="relative isolate overflow-hidden bg-[#0e1213]">
        <Image
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80"
          alt=""
          fill
          sizes="100vw"
          className="-z-10 object-cover"
          preload
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0e1213]/85 via-[#0e1213]/45 to-[#0e1213]/10" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-[#0e1213]/60 to-transparent" />
        <div className="glow-spot -z-10" aria-hidden="true" />
        <section
          aria-labelledby="hero-title"
          className="mx-auto flex min-h-[32rem] max-w-7xl flex-col justify-end px-4 pb-28 pt-24 sm:px-6 sm:pb-32 lg:min-h-[40rem] lg:px-8"
        >
          <div className="max-w-3xl text-white">
            <h1
              id="hero-title"
              style={{ "--delay": "0.1s" } as CSSProperties}
              className="rise font-display text-[clamp(2.75rem,6.5vw,5.25rem)] font-semibold leading-[1.02] tracking-tight"
            >
              Encuentra tu próxima propiedad en Chile
            </h1>
            <p
              style={{ "--delay": "0.25s" } as CSSProperties}
              className="rise mt-6 max-w-xl text-lg leading-relaxed text-white/80"
            >
              Casas, departamentos, oficinas y terrenos en venta y arriendo en todo Chile.
            </p>
          </div>
        </section>
      </PointerGlow>
      {/* The search bar floats over the lower edge of the hero. */}
      <div
        style={{ "--delay": "0.4s" } as CSSProperties}
        className="rise relative z-10 mx-auto -mt-14 w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <PropertySearchForm />
      </div>
    </>
  );
}
