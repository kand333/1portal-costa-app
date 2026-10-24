"use client";

import { useState } from "react";
import { VALUATION_AMENITY_LABELS, type ValuationRequest, type ValuationResult } from "@portal/shared/valuation";
import { formatUf, formatPesos } from "@/components/tasador/valuation-summary";
import { operationLabels, propertyTypeLabels } from "@/lib/property-format";
import { downloadValuationReport } from "@/lib/valuation-api";

type ValuationResultViewProps = {
  request: ValuationRequest;
  result: ValuationResult;
  /** The person already left their data from the contact dialog. */
  contacted: boolean;
  onContact: () => void;
  onRestart: () => void;
};

/** Summary: the price (UF for sales, CLP per month for rents), its range and the data it was based on. */
export function ValuationResultView({ request, result, contacted, onContact, onRestart }: ValuationResultViewProps) {
  const isRent = request.operation === "RENT";
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

  return (
    <div>
      <p className="text-sm text-muted">
        {request.address}, {request.commune}
      </p>

      {result.status === "ok" ? (
        <div role="status" className="mt-3">
          <p className="text-sm font-medium text-muted">Precio estimado de {isRent ? "arriendo" : "venta"}</p>
          {result.uf ? (
            <>
              <p className="mt-1 font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
                {formatUf(result.uf.estimate)}
              </p>
              <p className="mt-1 text-muted">{formatPesos(result.estimate)}</p>
            </>
          ) : (
            <>
              <p className="mt-1 font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
                {formatPesos(result.estimate)}
                {isRent && <span className="text-2xl font-medium text-muted"> /mes</span>}
              </p>
              {!isRent && <p className="mt-1 text-sm text-muted">No pudimos obtener el valor de la UF ahora, por eso se muestra en pesos.</p>}
            </>
          )}

          <dl className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-muted">Rango probable</dt>
              <dd className="mt-0.5 font-semibold text-ink">
                {result.uf
                  ? `${formatUf(result.uf.low)} a ${formatUf(result.uf.high)}`
                  : `${formatPesos(result.low)} a ${formatPesos(result.high)}`}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Precio por m²</dt>
              <dd className="mt-0.5 font-semibold text-ink">{formatPesos(result.pricePerSquareMeter)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Propiedades comparadas</dt>
              <dd className="mt-0.5 font-semibold text-ink">{result.comparablesCount}</dd>
            </div>
          </dl>

          <p className="mt-5 text-sm text-muted">
            {result.scope === "commune"
              ? `Calculado con propiedades publicadas en ${request.commune}.`
              : `En ${request.commune} hay pocas propiedades comparables, así que usamos las publicadas en todo el portal.`}{" "}
            {result.uf && `UF de hoy: ${formatPesos(result.uf.value)}. `}
            Es una estimación orientativa y no reemplaza una tasación bancaria.
          </p>
        </div>
      ) : (
        <div role="status" className="mt-3">
          <p className="font-display text-3xl font-semibold text-ink">Aún no tenemos datos suficientes</p>
          <p className="mt-2 max-w-xl text-muted">
            No hay propiedades comparables publicadas para dar un precio confiable, y preferimos no inventarlo. Déjanos tus
            datos y un corredor te hará una tasación.
          </p>
        </div>
      )}

      <div className="mt-6 border-t border-line pt-5">
        <h2 className="font-semibold text-ink">Datos de la propiedad</h2>
        <p className="mt-1 text-sm text-muted">
          {propertyTypeLabels[request.propertyType]} en {operationLabels[request.operation].toLowerCase()}, {request.totalArea} m²
          totales, {request.usableArea} m² construidos, {request.bedrooms} dormitorios, {request.bathrooms} baños y{" "}
          {request.parkingSpaces} estacionamientos.
        </p>
        {request.amenities.length > 0 && (
          <p className="mt-1 text-sm text-muted">
            Amenidades: {request.amenities.map((amenity) => VALUATION_AMENITY_LABELS[amenity]).join(", ")}.
          </p>
        )}
      </div>

      {result.status === "ok" && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => void generateReport()}
            disabled={isGenerating}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-accent px-6 font-semibold text-ink transition-[background-color,color,transform] duration-200 hover:-translate-y-px hover:bg-accent hover:text-on-accent active:translate-y-0 disabled:translate-y-0 disabled:opacity-70"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" />
            </svg>
            {isGenerating ? "Generando informe…" : "Generar Informe PDF"}
          </button>
          <p className="mt-2 text-sm text-muted">Informe referencial con los datos y el cálculo de esta estimación.</p>
          {reportError && (
            <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
              {reportError}
            </p>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        {contacted ? (
          <p role="status" className="font-semibold text-ink">
            Recibimos tus datos. Un corredor te contactará pronto.
          </p>
        ) : (
          <button
            type="button"
            onClick={onContact}
            className="h-12 rounded-full bg-accent px-6 font-semibold text-on-accent transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-accent-hover active:translate-y-0"
          >
            Quiero que me contacten
          </button>
        )}
        <button
          type="button"
          onClick={onRestart}
          className="border-b border-brass pb-0.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink"
        >
          Estimar otra propiedad
        </button>
      </div>
    </div>
  );
}
