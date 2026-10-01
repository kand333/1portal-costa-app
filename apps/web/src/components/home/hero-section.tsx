import Image from "next/image";
import { PropertySearchForm } from "@/components/properties/property-search-form";

export function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80"
        alt=""
        fill
        sizes="100vw"
        className="-z-10 object-cover"
        preload
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-zinc-950/70 via-zinc-950/50 to-zinc-950/70" />
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="max-w-2xl text-white">
          <h1 id="hero-title" className="text-4xl font-bold tracking-tight sm:text-5xl">
            Encuentra tu próxima propiedad en Chile
          </h1>
          <p className="mt-4 text-lg text-zinc-200">
            Casas, departamentos, oficinas y terrenos en venta y arriendo en todo Chile.
          </p>
        </div>
        <PropertySearchForm />
      </div>
    </section>
  );
}
