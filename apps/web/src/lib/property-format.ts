import type { Currency, OperationType, PropertySort, PropertyType } from "@portal/shared/enums";

export const operationLabels: Record<OperationType, string> = {
  SALE: "Venta",
  RENT: "Arriendo",
};

export const propertyTypeLabels: Record<PropertyType, string> = {
  HOUSE: "Casa",
  APARTMENT: "Departamento",
  LAND: "Terreno",
  OFFICE: "Oficina",
  COMMERCIAL: "Local comercial",
  OTHER: "Otro",
};

const ONE_MILLION = 1_000_000;

const formatAmount = (amount: number, currency: Currency, maximumFractionDigits: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency, maximumFractionDigits }).format(amount);

/** Formats a price for display: sales in millions of pesos ("$846 millones"), rent prices in full and monthly. */
export function formatPrice(price: number, currency: Currency, operationType: OperationType): string {
  if (operationType === "RENT") return `${formatAmount(price, currency, 0)} /mes`;
  if (price < ONE_MILLION) return formatAmount(price, currency, 0);
  const millions = Math.round((price / ONE_MILLION) * 10) / 10;
  return `${formatAmount(millions, currency, 1)} ${millions === 1 ? "millón" : "millones"}`;
}

export function formatLocation(commune: string, city: string): string {
  return commune === city ? commune : `${commune}, ${city}`;
}

/** Formats a surface in square meters, e.g. "80,5 m²". */
export function formatArea(squareMeters: number): string {
  return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(squareMeters)} m²`;
}

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

export type PropertyHighlight = {
  kind: "bedrooms" | "bathrooms" | "area";
  text: string;
};

type HighlightSource = {
  bedrooms: number | null;
  bathrooms: number | null;
  usableArea: number | null;
  totalArea: number | null;
};

/**
 * Key facts shown on a property card, only when they apply: rooms and the
 * usable surface, falling back to the total surface (e.g. land).
 */
export function getPropertyHighlights(property: HighlightSource): PropertyHighlight[] {
  const highlights: PropertyHighlight[] = [];
  if (property.bedrooms !== null && property.bedrooms > 0) {
    highlights.push({ kind: "bedrooms", text: pluralize(property.bedrooms, "dormitorio", "dormitorios") });
  }
  if (property.bathrooms !== null && property.bathrooms > 0) {
    highlights.push({ kind: "bathrooms", text: pluralize(property.bathrooms, "baño", "baños") });
  }
  if (property.usableArea !== null) {
    highlights.push({ kind: "area", text: `${formatArea(property.usableArea)} útiles` });
  } else if (property.totalArea !== null) {
    highlights.push({ kind: "area", text: `${formatArea(property.totalArea)} totales` });
  }
  return highlights;
}

/** Age of a building: 0 means brand new. */
export function formatAge(ageInYears: number): string {
  return ageInYears === 0 ? "A estrenar" : pluralize(ageInYears, "año", "años");
}

export type PropertyFact = {
  label: string;
  value: string;
};

type FactSource = HighlightSource & {
  operationType: OperationType;
  propertyType: PropertyType;
  parkingSpaces: number | null;
  ageInYears: number | null;
};

/** Data sheet of the detail page. Facts without a value (e.g. bedrooms of a plot of land) are left out. */
export function getPropertyFacts(property: FactSource): PropertyFact[] {
  const facts: (PropertyFact | null)[] = [
    { label: "Operación", value: operationLabels[property.operationType] },
    { label: "Tipo", value: propertyTypeLabels[property.propertyType] },
    property.usableArea !== null ? { label: "Superficie útil", value: formatArea(property.usableArea) } : null,
    property.totalArea !== null ? { label: "Superficie total", value: formatArea(property.totalArea) } : null,
    property.bedrooms !== null ? { label: "Dormitorios", value: String(property.bedrooms) } : null,
    property.bathrooms !== null ? { label: "Baños", value: String(property.bathrooms) } : null,
    property.parkingSpaces !== null ? { label: "Estacionamientos", value: String(property.parkingSpaces) } : null,
    property.ageInYears !== null ? { label: "Antigüedad", value: formatAge(property.ageInYears) } : null,
  ];
  return facts.filter((fact) => fact !== null);
}

export const sortLabels: Record<PropertySort, string> = {
  newest: "Más recientes",
  "price-asc": "Precio: menor a mayor",
  "price-desc": "Precio: mayor a menor",
  "area-asc": "Superficie: menor a mayor",
  "area-desc": "Superficie: mayor a menor",
};
