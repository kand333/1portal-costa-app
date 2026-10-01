import type { Currency, OperationType, PropertyType } from "@portal/shared/enums";

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
