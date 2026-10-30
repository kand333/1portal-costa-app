import Link from "next/link";
import type { ReactNode } from "react";
import { IsometricCity, IsometricHouse, PhoneMockup } from "@/components/home/step-art";
import { cn } from "@/lib/cn";

const STATEMENT = "Compra o vende con un corredor que conoce tu comuna";

const steps: { label: string; title: string; kicker: string; description: string; ground: string; art: ReactNode }[] = [
  {
    label: "Paso 1",
    title: "Cuéntanos qué buscas",
    kicker: "Comuna y tipo de propiedad",
    description: "Toma menos de un minuto.",
    ground: "bg-sand",
    art: <PhoneMockup />,
  },
  {
    label: "Paso 2",
    title: "Te mostramos proyectos",
    kicker: "Selección para ti",
    description: "Un corredor local te presenta los proyectos y propiedades que calzan con lo que buscas.",
    ground: "bg-paper",
    art: <IsometricHouse />,
  },
  {
    label: "Paso 3",
    title: "Te acompañamos hasta la escritura",
    kicker: "Reserva, financiamiento y cierre",
    description: "Te guiamos en cada trámite, y si eres dueño, también tasamos y vendemos tu propiedad.",
    ground: "bg-sand",
    art: <IsometricCity />,
  },
];

/** A big statement whose words darken as it scrolls in, then three steps that stack as cards (sticky on wide screens). */
export function LeadSteps() {
  return (
    <>
      <section aria-labelledby="gap-title" className="mx-auto w-full max-w-5xl px-4 py-28 text-center sm:px-6 lg:px-8 lg:py-40">
        <h2 id="gap-title" className="font-display text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[1.02] text-ink">
          {STATEMENT.split(" ").map((word, index) => (
            <span key={`${word}-${index}`} className="scrub-word">
              {word}{" "}
            </span>
          ))}
        </h2>
      </section>

      <section aria-labelledby="steps-title">
        <h2 id="steps-title" className="sr-only">
          Así funciona
        </h2>
        <ol>
          {steps.map((step, index) => (
            <li
              key={step.title}
              style={{ zIndex: index + 1 }}
              className={cn(
                "relative rounded-t-[2.5rem] border-t border-line px-4 py-16 shadow-[0_-24px_60px_-34px_rgb(var(--shadow-ink)/0.55)] sm:px-6 lg:sticky lg:top-0 lg:flex lg:min-h-svh lg:items-center lg:px-8",
                step.ground,
              )}
            >
              <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-2">
                <div className="max-w-md">
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted">{step.label}</p>
                  <h3 className="mt-6 text-4xl font-medium tracking-tight text-ink sm:text-5xl">{step.title}</h3>
                  <p className="mt-6 font-mono text-xs font-medium uppercase tracking-[0.18em] text-ink">{step.kicker}</p>
                  <p className="mt-4 text-lg leading-relaxed text-muted">{step.description}</p>
                  {index === 0 && (
                    <Link
                      href="/#tasacion-gratis"
                      className="mt-8 inline-flex h-12 items-center rounded-lg bg-ink px-6 font-semibold text-paper transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      Contáctanos
                    </Link>
                  )}
                </div>
                <div className="flex justify-center">{step.art}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
