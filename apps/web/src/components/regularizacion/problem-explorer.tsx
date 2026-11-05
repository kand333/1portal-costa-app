"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { buildRegularizationUrl, PROPERTY_PROBLEMS } from "@/lib/regularization";
import { cn } from "@/lib/cn";

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

/** Pick what is wrong with the property; the panel explains it, draws the usual path and opens WhatsApp with that problem written in. */
export function ProblemExplorer() {
  const [activeId, setActiveId] = useState<string>(PROPERTY_PROBLEMS[0].id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = PROPERTY_PROBLEMS.find((problem) => problem.id === activeId) ?? PROPERTY_PROBLEMS[0];
  const consultationUrl = buildRegularizationUrl(whatsappNumber, active);

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = PROPERTY_PROBLEMS.length - 1;
    const keyTargets: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowDown: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const target = keyTargets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    setActiveId(PROPERTY_PROBLEMS[target].id);
    tabRefs.current[target]?.focus();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-10">
      <div
        role="tablist"
        aria-label="Problemas de una propiedad"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
      >
        {PROPERTY_PROBLEMS.map((problem, index) => {
          const selected = problem.id === active.id;
          return (
            <button
              key={problem.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              id={`problem-tab-${problem.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="problem-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(problem.id)}
              onKeyDown={(event) => moveFocus(event, index)}
              className={cn(
                "min-h-11 shrink-0 rounded-full border px-4 py-2 text-left text-sm font-medium transition-[background-color,border-color,color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:rounded-2xl lg:px-5 lg:py-3 lg:text-base",
                selected
                  ? "border-transparent bg-[image:var(--ember)] text-white shadow-soft lg:translate-x-2"
                  : "border-line bg-surface text-ink hover:border-brass hover:text-brass-text",
              )}
            >
              {problem.label}
            </button>
          );
        })}
      </div>

      <div
        id="problem-panel"
        role="tabpanel"
        aria-labelledby={`problem-tab-${active.id}`}
        tabIndex={0}
        // Keyed on the problem so each pick replays the swap and redraws the path.
        key={active.id}
        className="panel-swap rounded-[1.75rem] border border-line bg-surface p-6 sm:p-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <h3 className="font-display text-3xl text-ink sm:text-4xl">{active.label}</h3>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-ink">Qué significa</dt>
            <dd className="mt-1 leading-relaxed text-muted">{active.meaning}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-ink">Por qué frena una venta</dt>
            <dd className="mt-1 leading-relaxed text-muted">{active.blocks}</dd>
          </div>
        </dl>

        <p className="mt-8 text-sm font-semibold text-ink">El camino habitual</p>
        <ol className="relative mt-4 space-y-5 pl-9">
          <span aria-hidden="true" className="timeline-draw absolute bottom-2 left-[0.8125rem] top-2 w-0.5 bg-brass" />
          {active.steps.map((step, index) => (
            <li key={step} className="relative leading-relaxed text-ink">
              <span
                aria-hidden="true"
                className="absolute -left-9 top-0 flex size-7 items-center justify-center rounded-full bg-[image:var(--ember)] text-sm font-bold text-white"
              >
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          {consultationUrl ? (
            <a
              href={consultationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center rounded-lg bg-accent px-6 font-bold text-on-accent shadow-soft transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-accent-hover"
            >
              Consultar este caso por WhatsApp
            </a>
          ) : (
            <Link
              href="/tasador-propiedades"
              className="inline-flex min-h-12 items-center rounded-lg bg-accent px-6 font-bold text-on-accent shadow-soft transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-accent-hover"
            >
              Pedir tasación gratis
            </Link>
          )}
          <p className="max-w-sm text-sm text-muted">
            Es una guía general. Nuestro equipo jurídico revisa los trámites según tu caso.
          </p>
        </div>
      </div>
    </div>
  );
}
