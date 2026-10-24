import Link from "next/link";
import { LeadForm } from "@/components/home/lead-form";

const buttonClassName =
  "inline-flex h-12 items-center rounded-full px-7 font-semibold transition-[background-color,color,border-color,transform] duration-200 hover:-translate-y-px active:translate-y-0";

export function CallToActionSection() {
  return (
    <section aria-labelledby="call-to-action-title" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div
        id="cierre"
        className="relative isolate grid scroll-mt-24 gap-10 overflow-hidden rounded-[1.75rem] bg-[#1e3b3a] p-8 text-[#f6f5f2] sm:p-12 lg:grid-cols-2 lg:items-center"
      >
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-[radial-gradient(circle,rgb(169_139_91/0.35),transparent_65%)]"
        />
        <div>
          <h2 id="call-to-action-title" className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Descubre cuánto vale tu propiedad hoy
          </h2>
          <p className="mt-4 max-w-md text-[#f6f5f2]/75">
            Gratis y sin compromiso. Si prefieres comprar o arrendar, cuéntanos qué buscas y te ayudamos.
          </p>
        </div>
        <div className="rounded-[1.5rem] bg-surface p-5 text-ink sm:p-6">
          <LeadForm source="home-closing" idPrefix="closing-lead" />
        </div>
      </div>
      <div className="mt-5 flex flex-col items-start gap-5 rounded-[1.75rem] border border-line px-8 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div>
          <h3 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Guarda las propiedades que te interesan
          </h3>
          <p className="mt-1 text-muted">Ingresa para guardar favoritos y revisar tus consultas.</p>
        </div>
        <Link
          href="/login"
          className={`${buttonClassName} shrink-0 border border-line text-ink hover:border-brass hover:bg-surface`}
        >
          Ingresar
        </Link>
      </div>
    </section>
  );
}
