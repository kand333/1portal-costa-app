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

/** Formats a price for display; rent prices are monthly. */
export function formatPrice(price: number, currency: Currency, operationType: OperationType): string {
  const formatted = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
  return operationType === "RENT" ? `${formatted} /mes` : formatted;
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

export const sortLabels: Record<PropertySort, string> = {
  newest: "Más recientes",
  "price-asc": "Precio: menor a mayor",
  "price-desc": "Precio: mayor a menor",
  "area-asc": "Superficie: menor a mayor",
  "area-desc": "Superficie: mayor a menor",
};
