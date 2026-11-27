import {
  VALUATION_AMENITY_LABELS,
  displayedComparables,
  type ValuationRequest,
  type ValuationResult,
} from "@portal/shared/valuation";
import { REPORT_BRAND } from "@/lib/pdf/report-brand";
import type { UfQuote } from "@/lib/uf-value";

type OkResult = Extract<ValuationResult, { status: "ok" }>;

/** Below this many comparables the report says the sample is small. */
export const SMALL_SAMPLE = 5;
const TIME_ZONE = "America/Santiago";

export type VerificationStatus = "informed" | "pending";
export type FactRow = { label: string; value: string; status: VerificationStatus };

/** Everything the PDF shows, already worded. The renderer only draws it. */
export type ReportContent = {
  issuedOn: string;
  cover: { address: string; commune: string; propertyType: string; operation: string };
  /** The figure and its range, drawn large on the cover. */
  hero: {
    label: string;
    headline: string;
    /** The same amount in pesos ("$242,2 millones") beside a UF headline; null when the headline is already pesos. */
    headlineSecondary: string | null;
    /** Position of the reference value inside the range bar, 0 to 1. */
    markerShare: number;
    low: { label: string; value: string; sub: string | null };
    mid: { label: string; value: string; sub: string | null };
    high: { label: string; value: string; sub: string | null };
    stats: { label: string; value: string; sub: string }[];
    sourceNote: string;
  };
  summary: {
    facts: { label: string; value: string }[];
    meaning: string[];
    conversionNote: string | null;
  };
  characteristics: FactRow[];
  market: {
    stats: { label: string; value: string }[];
    /** Names of the amenities the owner marked; the report never states their effect on the price. */
    amenities: string[];
    notes: string[];
  };
  recommendations: string[];
  conclusion: {
    synthesis: string;
    source: string;
    referenceDate: string;
    pending: string[];
    scope: string[];
  };
};

const propertyTypeNames = { HOUSE: "Casa", APARTMENT: "Departamento" } as const;
const operationNames = { SALE: "Venta", RENT: "Arriendo" } as const;

const pesos = (amount: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(amount);
const uf = (amount: number) => `UF ${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(amount)}`;
const uf1 = (amount: number) => `UF ${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(amount)}`;
/** "$242,2 millones" for amounts from one million up, plain pesos below. */
const millions = (clp: number) =>
  clp >= 1_000_000 ? `$${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(clp / 1_000_000)} millones` : pesos(clp);
const squareMeters = (amount: number) =>
  `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(amount)} m²`;
const longDate = (date: Date) =>
  new Intl.DateTimeFormat("es-CL", { dateStyle: "long", timeZone: TIME_ZONE }).format(date);
/** `YYYY-MM-DD` of a UF quote, shown as a long date without shifting it by the time zone. */
const quoteDate = (isoDate: string) => longDate(new Date(`${isoDate}T12:00:00Z`));

const countLabel = (count: number, singular: string, plural: string) => `${count} ${count === 1 ? singular : plural}`;

/**
 * Builds the wording of the report from the request and the estimate the server just computed.
 * Pure: the date and the UF quote come in as arguments. Only data the system holds is used; whatever the
 * person typed is marked as informed, and what is not known says so instead of being filled in.
 */
export function buildReportContent(
  request: ValuationRequest,
  result: OkResult,
  issuedAt: Date,
  ufQuote: UfQuote | null,
): ReportContent {
  const isSale = request.operation === "SALE";
  // Only a sale is expressed in UF, and only with a quote of the day.
  const toUf = isSale && ufQuote ? (clp: number) => clp / ufQuote.value : null;
  const money = (clp: number) => (toUf ? uf(toUf(clp)) : pesos(clp));

  const headline = toUf ? uf(toUf(result.estimate)) : pesos(result.estimate) + (isSale ? "" : " al mes");
  const headlineSecondary = toUf ? `${pesos(result.estimate)} al valor de la UF del ${quoteDate(ufQuote!.date)}` : null;
  const conversionNote = isSale
    ? ufQuote
      ? `UF de ${pesos(ufQuote.value)} (mindicador.cl, ${quoteDate(ufQuote.date)}).`
      : "No se pudo obtener el valor de la UF al emitir este informe: falta actualizar la conversión, por eso el valor se muestra en pesos."
    : "Los arriendos se expresan en pesos chilenos mensuales.";

  // Only what the owner marked: the report never says how much each amenity moves the price.
  const amenityLabels = request.amenities.map((amenity) => VALUATION_AMENITY_LABELS[amenity]);

  const sectorText = result.sector ? `el sector ${result.sector} (${request.commune})` : request.commune;
  const publishedText =
    result.scope === "commune"
      ? `propiedades publicadas en ${request.commune}`
      : `propiedades publicadas en todo el portal, porque en ${request.commune} hay pocas comparables`;
  const scopeText =
    result.basis === "reference"
      ? `la tabla de referencia de precios por sector de ${sectorText}`
      : result.basis === "mixed"
        ? `${publishedText}, combinadas con la tabla de referencia de ${sectorText}`
        : publishedText;
  const sourceBase =
    result.basis === "reference" ? "Tabla de referencia de precios por sector del portal" : "Precios publicados en el portal y tabla de referencia por sector";

  const recommendations: string[] = [];
  if (result.basis === "reference") {
    recommendations.push(
      "El valor sale de la tabla de referencia por sector, que se revisa y actualiza a mano. Tómalo como una orientación inicial y pide una tasación con un corredor para afinarlo.",
    );
  } else if (result.comparablesCount < SMALL_SAMPLE) {
    recommendations.push(
      `La muestra es pequeña (${countLabel(displayedComparables(result.comparablesCount), "propiedad comparable", "propiedades comparables")}): toma el rango como una orientación amplia y no como una cifra exacta.`,
    );
  }
  if (result.scope === "portal" && result.basis !== "reference") {
    recommendations.push(
      `Como en ${request.commune} hay pocas propiedades comparables, el valor incluye propiedades de otras comunas. Un corredor puede afinarlo con casos de la zona.`,
    );
  }
  recommendations.push(
    `Un precio de publicación dentro del rango (${money(result.low)} a ${money(result.high)}) es coherente con las propiedades comparadas. Sobre el extremo alto quedas por encima del percentil 75 del precio por m² de esa muestra.`,
  );
  const pending = [
    "Superficies, dormitorios, baños, estacionamientos y amenidades: los informó el propietario y no se verificaron con documentos.",
    "Materialidad, terminaciones y estado de conservación: sin antecedentes.",
    "Título de dominio, gravámenes y avalúo fiscal: no se revisaron.",
  ];

  return {
    issuedOn: longDate(issuedAt),
    cover: {
      address: request.address,
      commune: request.commune,
      propertyType: propertyTypeNames[request.propertyType],
      operation: operationNames[request.operation],
    },
    hero: {
      label: `Valor de referencia de ${isSale ? "venta" : "arriendo"}`,
      headline,
      headlineSecondary: toUf ? millions(result.estimate) : null,
      markerShare: result.high > result.low ? Math.min(1, Math.max(0, (result.estimate - result.low) / (result.high - result.low))) : 0.5,
      low: { label: "Mínimo probable", value: money(result.low), sub: toUf ? millions(result.low) : null },
      mid: { label: "Valor de referencia", value: money(result.estimate), sub: toUf ? millions(result.estimate) : null },
      high: { label: "Máximo probable", value: money(result.high), sub: toUf ? millions(result.high) : null },
      stats: [
        {
          label: "Propiedades comparadas",
          value: String(displayedComparables(result.comparablesCount)),
          sub: result.basis === "reference" ? "Referencia por sector" : result.scope === "commune" ? `Publicadas en ${request.commune}` : "Publicadas en todo el portal",
        },
        { label: isSale ? "Por m² construido" : "Por m² construido al mes", value: toUf ? uf1(result.pricePerSquareMeter / ufQuote!.value) : pesos(result.pricePerSquareMeter), sub: result.basis === "reference" ? "Referencia del sector" : "Mediana de la muestra" },
        { label: "Superficie construida", value: squareMeters(request.usableArea), sub: `${squareMeters(request.totalArea)} totales` },
        { label: "Dormitorios y baños", value: `${request.bedrooms} y ${request.bathrooms}`, sub: countLabel(request.parkingSpaces, "estacionamiento", "estacionamientos") },
      ],
      sourceNote: `${sourceBase}${isSale && ufQuote ? ` y la UF de mindicador.cl del ${quoteDate(ufQuote.date)}` : ""}.`,
    },
    summary: {
      facts: [
        { label: "Valor de referencia", value: headline },
        ...(headlineSecondary ? [{ label: "Equivalente en pesos", value: pesos(result.estimate) }] : []),
        { label: "Rango probable", value: `${money(result.low)} a ${money(result.high)}` },
        { label: "Superficie construida", value: squareMeters(request.usableArea) },
        { label: "Superficie total", value: squareMeters(request.totalArea) },
        { label: "Dormitorios", value: String(request.bedrooms) },
        { label: "Baños", value: String(request.bathrooms) },
        { label: "Estacionamientos", value: String(request.parkingSpaces) },
        { label: "Año de construcción", value: String(request.constructionYear) },
      ],
      meaning: [
        `Es el precio al que se ofrecen hoy propiedades parecidas a la tuya: ${request.operation === "SALE" ? "de venta" : "de arriendo"}, del mismo tipo y con características similares. Sirve como punto de partida para decidir a qué precio publicar.`,
        "No es el precio al que se cerrará una operación: eso depende del estado real de la propiedad, de la negociación y del momento del mercado.",
      ],
      conversionNote,
    },
    characteristics: [
      { label: "Tipo de inmueble", value: propertyTypeNames[request.propertyType], status: "informed" },
      { label: "Operación", value: operationNames[request.operation], status: "informed" },
      { label: "Dirección", value: request.address, status: "informed" },
      { label: "Comuna", value: request.commune, status: "informed" },
      { label: "Superficie total", value: squareMeters(request.totalArea), status: "informed" },
      { label: "Superficie construida", value: squareMeters(request.usableArea), status: "informed" },
      { label: "Dormitorios", value: String(request.bedrooms), status: "informed" },
      { label: "Baños", value: String(request.bathrooms), status: "informed" },
      { label: "Estacionamientos", value: String(request.parkingSpaces), status: "informed" },
      {
        label: "Amenidades",
        value: amenityLabels.length ? amenityLabels.join(", ") : "Ninguna informada",
        status: "informed",
      },
      { label: "Año de construcción", value: String(request.constructionYear), status: "informed" },
      { label: "Materialidad y terminaciones", value: "Sin antecedentes", status: "pending" },
      { label: "Estado de conservación", value: "Sin antecedentes", status: "pending" },
    ],
    market: {
      stats: [
        { label: "Propiedades comparadas", value: String(displayedComparables(result.comparablesCount)) },
        {
          label: "Origen de la muestra",
          value: result.basis === "reference" ? "Tabla de referencia por sector" : result.scope === "commune" ? request.commune : "Todo el portal",
        },
        { label: "Precio mediano por m² construido", value: pesos(result.pricePerSquareMeter) },
        { label: "Rango del valor estimado", value: `${money(result.low)} a ${money(result.high)}` },
      ],
      amenities: amenityLabels,
      notes: [
        `El valor se calculó con ${scopeText}, del mismo tipo (${propertyTypeNames[request.propertyType].toLowerCase()}) y operación (${operationNames[request.operation].toLowerCase()}).`,
        "Son precios publicados en el portal, no precios efectivos de venta o de arriendo cerrados.",
        "Método: precio por m² de referencia del sector (tabla revisada a mano), combinado con la mediana de las propiedades comparables publicadas (sin valores atípicos): cada comparable pesa más a medida que hay más. Se multiplica por los m² construidos informados, con ajustes acotados por dormitorios, baños y estacionamientos, y por el año de construcción (cada año de diferencia con el inmueble típico mueve el precio un 0,7 %).",
        "No se incluye información del entorno (comercio, transporte, salud, educación) porque este informe no consulta fuentes externas para ello.",
      ],
    },
    recommendations,
    conclusion: {
      synthesis: `Para ${propertyTypeNames[request.propertyType].toLowerCase()} de ${squareMeters(request.usableArea)} construidos en ${request.address}, ${request.commune}, el valor de referencia de ${isSale ? "venta" : "arriendo"} es ${headline}, con un rango probable de ${money(result.low)} a ${money(result.high)}.`,
      source: `${sourceBase}${isSale && ufQuote ? " y valor de la UF de mindicador.cl" : ""}. Estimación automatizada de ${REPORT_BRAND.name}.`,
      referenceDate: longDate(issuedAt),
      pending,
      scope: [
        "Este informe es referencial. Lo genera un modelo automatizado a partir de precios publicados y de datos informados por el propietario.",
        "No constituye una tasación profesional presencial, no reemplaza una tasación bancaria o pericial y no garantiza que la propiedad se venda o se arriende a ese precio.",
      ],
    },
  };
}

