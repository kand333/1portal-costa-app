import type { ValuationRequest, ValuationResult } from "@portal/shared/valuation";
import { postJson } from "./api-client";

/** Asks the API for the price estimate of a property. Throws `ApiClientError` with the server's message. */
export function requestValuation(request: ValuationRequest): Promise<ValuationResult> {
  return postJson<ValuationResult>("/api/valuations", request);
}

/** Downloads the PDF report of an estimate. Throws `ApiClientError`-like errors with the server's message. */
export async function downloadValuationReport(request: ValuationRequest): Promise<void> {
  const response = await fetch("/api/valuations/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message = body && typeof body === "object" && "message" in body ? String(body.message) : "";
    throw new Error(message || "No pudimos generar el informe. Inténtalo de nuevo.");
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = "informe-de-valoracion.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
