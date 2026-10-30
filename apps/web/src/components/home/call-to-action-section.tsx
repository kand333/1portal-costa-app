import Image from "next/image";
import Link from "next/link";
import { LeadForm } from "@/components/home/lead-form";

// Test photo (Unsplash). Swap it here for the real one.
const CLOSING_PHOTO = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80";

const buttonClassName =
  "inline-flex h-12 items-center rounded-full px-7 font-semibold transition-[background-color,color,border-color,transform] duration-200 hover:-translate-y-px active:translate-y-0";

/** A split close: a brand-blue block with the lead form beside a photo and a sliding orange tile, then the sign-in strip. */
export function CallToActionSection() {
  return (
    <section aria-labelledby="call-to-action-title" className="w-full">
      <div id="cierre" className="grid scroll-mt-24 lg:grid-cols-2">
        <div className="bg-brand-blue px-4 py-16 text-white sm:px-8 lg:px-12 lg:py-24 lg:pl-[max(3rem,calc((100vw-80rem)/2+2rem))]">
          <h2 id="call-to-action-title" className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.02]">
            Cuéntanos qué necesitas
          </h2>
          <p className="mt-4 max-w-md text-white/80">Comprar un depto nuevo, tasar o vender con corretaje tradicional: una corredora que conoce el Gran Concepción te acompaña.</p>
          <div className="mt-8 max-w-lg rounded-[1.5rem] bg-surface p-5 text-ink sm:p-6">
            <LeadForm source="home-closing" idPrefix="closing-lead" />
          </div>
        </div>
        <div className="relative isolate min-h-[22rem] overflow-hidden lg:min-h-0">
          <Image src={CLOSING_PHOTO} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          <div
            aria-hidden="true"
            className="tile-slide absolute right-[10%] top-[12%] h-2/5 w-2/5 rounded-2xl bg-[image:var(--ember)] shadow-lift"
          />
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-5 rounded-[1.75rem] border border-line px-8 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div>
            <h3 className="font-display text-2xl text-ink">Guarda las propiedades que te interesan</h3>
            <p className="mt-1 text-muted">Ingresa para guardar favoritos y revisar tus consultas.</p>
          </div>
          <Link
            href="/login"
            className={`${buttonClassName} shrink-0 border border-line text-ink hover:border-brass hover:bg-surface`}
          >
            Ingresar
          </Link>
        </div>
      </div>
    </section>
  );
}
