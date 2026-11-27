"use client";

import { useState, type ReactNode } from "react";
import {
  VALUATION_AMENITY_LABELS,
  displayedComparables,
  displayedConfidence,
  type ValuationRequest,
  type ValuationResult,
} from "@portal/shared/valuation";
import { buildWhatsAppUrl } from "@/components/layout/whatsapp-button";
import { formatPesos, formatUf } from "@/components/tasador/valuation-summary";
import { operationLabels, propertyTypeLabels } from "@/lib/property-format";
import { downloadValuationReport } from "@/lib/valuation-api";

type ValuationResultViewProps = {
  request: ValuationRequest;
  result: ValuationResult;
  onRestart: () => void;
};

/** One sentence on what the figure rests on, so a figure with little market data is not read as an exact one. */
function basisText(commune: string, result: Extract<ValuationResult, { status: "ok" }>): string {
  const sector = result.sector ? `el sector ${result.sector} de ${commune}` : commune;
  if (result.basis === "reference") {
    return `Estimación referencial calculada con nuestra tabla de precios para ${sector}.`;
  }
  const published =
    result.scope === "commune"
      ? `propiedades publicadas en ${commune}`
      : `propiedades publicadas en todo el portal (en ${commune} hay pocas)`;
  return `Calculado con ${published}${result.basis === "mixed" ? `, combinadas con nuestra tabla de referencia para ${sector}` : ""}.`;
}

const countLabel = (count: number, singular: string, plural: string) => `${count} ${count === 1 ? singular : plural}`;

const iconProps = { "aria-hidden": true, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** One indicator tile: a small coloured icon, its label and its value. */
function Indicator({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-paper p-4 text-center">
      <dt className="flex flex-col items-center gap-2 text-sm text-muted">
        <span className="grid size-7 place-items-center rounded-full bg-brand-blue/25 text-white">{icon}</span>
        {label}
      </dt>
      <dd className="mt-2 flex flex-1 items-center justify-center font-semibold text-ink">{children}</dd>
    </div>
  );
}

const tagClassName = "inline-flex items-center rounded-full border border-line bg-paper px-3 py-1 text-sm font-medium text-ink";

/** Summary: the price (UF for sales, CLP per month for rents), its range and the data it was based on. */
export function ValuationResultView({ request, result, onRestart }: ValuationResultViewProps) {
  const isRent = request.operation === "RENT";
  // Position of the estimate within its range, 0 to 1 (the same rule the PDF report uses).
  const rangeShare = result.high > result.low ? Math.min(1, Math.max(0, (result.estimate - result.low) / (result.high - result.low))) : 0.5;
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportError, setReportError] = useState("");

  async function generateReport() {
    if (isGenerating) return;
    setIsGenerating(true);
    setReportError("");
    try {
      await downloadValuationReport(request);
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "No pudimos generar el informe. Inténtalo de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  }

  const agentUrl = buildWhatsAppUrl(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    `Hola, hice la tasación de mi ${propertyTypeLabels[request.propertyType].toLowerCase()} en ${request.commune} y quiero hablar con un agente.`,
  );
  const lowLabel = result.uf ? formatUf(result.uf.low) : formatPesos(result.low);
  const highLabel = result.uf ? formatUf(result.uf.high) : formatPesos(result.high);
  const confidenceTone = result.confidence === "high" ? "bg-success/20 text-success" : "bg-brand-blue/30 text-white";

  return (
    <div>
      <div
        role="status"
        className="rounded-3xl border border-line border-t-2 border-t-accent bg-surface p-6 text-center shadow-lift sm:p-8"
      >
        <p className="flex items-center justify-center gap-2 text-sm text-muted">
          <svg {...iconProps} className="size-4 shrink-0 text-muted">
            <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          {request.address}, {request.commune}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <span className={`rounded-full px-3.5 py-1 text-xs font-bold ${isRent ? "bg-brand-blue text-white" : "bg-accent text-on-accent"}`}>
            {isRent ? "Arriendo" : "En venta"}
          </span>
          <p className="text-sm font-medium text-muted">Precio estimado de {isRent ? "arriendo" : "venta"}</p>
        </div>

        {result.uf ? (
          <>
            <p className="mt-2 font-display display-heavy text-[clamp(3rem,10vw,5.5rem)] leading-none tracking-tight text-ink">
              {formatUf(result.uf.estimate)}
            </p>
            <p className="mt-3 font-display text-3xl figure-orange sm:text-4xl">
              <em className="display-accent">{formatPesos(result.estimate)} millones</em>
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 font-display display-heavy text-[clamp(3rem,10vw,5.5rem)] leading-none tracking-tight text-ink">
              {formatPesos(result.estimate)}
              {isRent ? <span className="font-sans text-2xl font-medium text-muted"> /mes</span> : <em className="display-accent text-3xl"> millones</em>}
            </p>
            {!isRent && <p className="mt-1 text-sm text-muted">No pudimos obtener el valor de la UF ahora, por eso se muestra en pesos.</p>}
          </>
        )}

        {/* Where the estimate sits inside its probable range. */}
        <div className="mt-8" aria-hidden="true">
          <div className="relative h-3 rounded-full bg-gradient-to-r from-brand-blue/80 via-line to-accent/80">
            <span
              className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-surface bg-accent shadow-lift"
              style={{ left: `${rangeShare * 100}%` }}
            />
            <span
              className="absolute -top-6 -translate-x-1/2 text-xs font-semibold figure-orange"
              style={{ left: `${Math.min(88, Math.max(12, rangeShare * 100))}%` }}
            >
              Estimado
            </span>
          </div>
          <div className="mx-auto mt-3 flex max-w-2xl justify-between gap-4 text-xs tabular-nums text-muted">
            <span>
              Mínimo · <span className="font-semibold text-ink">{lowLabel}</span>
            </span>
            <span>
              Máximo · <span className="font-semibold text-ink">{highLabel}</span>
            </span>
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Indicator label="Rango probable" icon={<svg {...iconProps} className="size-4"><path d="M4 12h16M4 12l3-3M4 12l3 3M20 12l-3-3M20 12l-3 3" /></svg>}>
          <span className="text-sm">{result.uf ? `${formatUf(result.uf.low)} a ${formatUf(result.uf.high)}` : `${formatPesos(result.low)} a ${formatPesos(result.high)}`}</span>
        </Indicator>
        <Indicator label="Precio por m²" icon={<svg {...iconProps} className="size-4"><path d="M4 4h16v16H4ZM4 9h5M15 4v5M9 20v-5M20 15h-5" /></svg>}>
          <span className="font-display text-2xl text-ink">{formatPesos(result.pricePerSquareMeter)}</span>
        </Indicator>
        <Indicator label="Propiedades comparadas" icon={<svg {...iconProps} className="size-4"><path d="M3 11.5 12 4l9 7.5M5.5 10v10h13V10" /></svg>}>
          <span className="font-display text-xl">{displayedComparables(result.comparablesCount)}</span>
        </Indicator>
        <Indicator label="Confianza" icon={<svg {...iconProps} className="size-4"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>}>
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${confidenceTone}`}>{displayedConfidence(result.confidence)}</span>
        </Indicator>
      </dl>

      <p className="mx-auto mt-4 flex max-w-2xl flex-col items-center gap-2 rounded-2xl border border-brand-blue/50 bg-brand-blue/10 p-4 text-center text-sm leading-relaxed text-ink">
        <svg {...iconProps} className="size-5 shrink-0 text-white">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h0" />
        </svg>
        <span>
          {basisText(request.commune, result)} {result.uf && `UF de hoy: ${formatPesos(result.uf.value)}. `}
          Es una estimación orientativa y no reemplaza una tasación bancaria.
        </span>
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-5 text-center">
        <h2 className="font-display display-heavy text-2xl text-ink">
          Datos de la <em className="display-accent">propiedad</em>
        </h2>
        {/* The full sentence stays for screen readers; the tags below are the visual version of it. */}
        <p className="sr-only">
          {propertyTypeLabels[request.propertyType]} en {operationLabels[request.operation].toLowerCase()}, {request.totalArea} m² totales,{" "}
          {request.usableArea} m² construidos, {request.bedrooms} dormitorios, {request.bathrooms} baños y {request.parkingSpaces} estacionamientos,
          construida en {request.constructionYear}.
        </p>
        <ul aria-hidden="true" className="mt-4 flex flex-wrap justify-center gap-2">
          <li className={tagClassName}>{propertyTypeLabels[request.propertyType]}</li>
          <li className={`${tagClassName} ${isRent ? "border-brand-blue" : "border-accent/60"}`}>{operationLabels[request.operation]}</li>
          <li className={tagClassName}>{request.totalArea} m² totales</li>
          <li className={tagClassName}>{request.usableArea} m² construidos</li>
          <li className={tagClassName}>{countLabel(request.bedrooms, "dormitorio", "dormitorios")}</li>
          <li className={tagClassName}>{countLabel(request.bathrooms, "baño", "baños")}</li>
          <li className={tagClassName}>{countLabel(request.parkingSpaces, "estacionamiento", "estacionamientos")}</li>
          <li className={tagClassName}>Construida en {request.constructionYear}</li>
        </ul>
        {request.amenities.length > 0 && (
          <>
            <p className="sr-only">Amenidades: {request.amenities.map((amenity) => VALUATION_AMENITY_LABELS[amenity]).join(", ")}.</p>
            <ul aria-hidden="true" className="mt-3 flex flex-wrap justify-center gap-2">
              {request.amenities.map((amenity) => (
                <li key={amenity} className={`${tagClassName} gap-1.5 border-accent/50 bg-accent/10`}>
                  <svg {...iconProps} strokeWidth={3} className="size-3.5 text-brass-text">
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                  {VALUATION_AMENITY_LABELS[amenity]}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => void generateReport()}
          disabled={isGenerating}
          className="inline-flex h-12 items-center gap-2 rounded-full border border-accent px-6 font-semibold text-ink transition-[background-color,color,transform] duration-200 hover:-translate-y-px hover:bg-accent hover:text-on-accent active:translate-y-0 disabled:translate-y-0 disabled:opacity-70 motion-reduce:transition-none"
        >
          <svg {...iconProps} className="size-4">
            <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" />
          </svg>
          {isGenerating ? "Generando informe…" : "Generar Informe PDF"}
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="border-b border-brass pb-0.5 text-sm font-semibold text-brass-text transition-colors duration-200 hover:border-ink"
        >
          Estimar otra propiedad
        </button>
      </div>
      <p className="mt-2 text-center text-sm text-muted">Informe referencial con los datos y el cálculo de esta estimación.</p>
      {reportError && (
        <p role="alert" className="mt-2 text-center text-sm text-red-700 dark:text-red-400">
          {reportError}
        </p>
      )}

      <section aria-labelledby="agent-title" className="agent-glow mx-auto mt-8 max-w-2xl rounded-3xl border border-agent/50 bg-surface p-6 text-center sm:p-8">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-agent/15 text-agent">
          <svg {...iconProps} className="size-6">
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
          </svg>
        </span>
        <h2 id="agent-title" className="mt-4 font-display display-heavy text-2xl text-ink sm:text-3xl">
          Contacta con un <em className="display-accent-agent">agente</em>
        </h2>
        <p className="mt-2 text-muted">Recibimos tus datos y un agente te escribirá pronto.</p>
        {agentUrl && (
          <a
            href={agentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-agent px-7 font-semibold text-on-agent transition-[transform,filter,box-shadow] duration-200 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_10px_28px_-12px_rgb(45_212_191/0.8)] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            Contacta con un agente
            <svg {...iconProps} className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        )}
      </section>
    </div>
  );
}
