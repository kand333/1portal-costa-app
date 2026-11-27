import {
  VALUATION_AMENITY_LABELS,
  type ValuationRequest,
  type ValuationResult,
} from "@portal/shared/valuation";
import { operationLabels, propertyTypeLabels } from "@/lib/property-format";

export const formatPesos = (amount: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(amount);

/** "4.820 UF": whole units, Chilean separators. */
export const formatUf = (amount: number) =>
  `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(amount)} UF`;

/** Short text stored with the lead so a broker sees what the person was told. */
export function summarizeValuation(request: ValuationRequest, result: ValuationResult): string {
  const amenities = request.amenities.length
    ? ` Amenidades: ${request.amenities.map((amenity) => VALUATION_AMENITY_LABELS[amenity].toLowerCase()).join(", ")}.`
    : "";
  const year = ` Año de construcción: ${request.constructionYear}.`;
  const subject = `${propertyTypeLabels[request.propertyType]} en ${request.commune}, ${request.usableArea} m² construidos (${operationLabels[request.operation].toLowerCase()})`;
  const uf = result.uf ? ` (${formatUf(result.uf.estimate)})` : "";
  const basis = result.basis === "reference" ? "referencia por sector, sin comparables" : `${result.comparablesCount} comparables`;
  return `${subject}.${year} Estimación ${formatPesos(result.estimate)}${uf}, rango ${formatPesos(result.low)} a ${formatPesos(result.high)}, ${basis}.${amenities}`;
}
