import { propertyInputSchema, type AdminPropertyDetail, type PropertyInputData } from "@portal/shared/admin-property";
import type { OperationType, PropertyType } from "@portal/shared/enums";

/** What the form fields hold: text as typed (numbers included) and the two switches. */
export type PropertyFormValues = {
  title: string;
  description: string;
  operationType: OperationType | "";
  propertyType: PropertyType | "";
  price: string;
  usableArea: string;
  totalArea: string;
  bedrooms: string;
  bathrooms: string;
  parkingSpaces: string;
  ageInYears: string;
  address: string;
  commune: string;
  city: string;
  region: string;
  features: string[];
  isPublished: boolean;
  isFeatured: boolean;
};

export type PropertyFormField = keyof PropertyFormValues;
export type PropertyFormErrors = Partial<Record<PropertyFormField, string>>;

const numberText = (value: number | null) => (value === null ? "" : String(value));

/** Initial values: empty for a new property, the stored data when editing. */
export function toPropertyFormValues(property: AdminPropertyDetail | null): PropertyFormValues {
  return {
    title: property?.title ?? "",
    description: property?.description ?? "",
    operationType: property?.operationType ?? "",
    propertyType: property?.propertyType ?? "",
    price: property ? String(property.price) : "",
    usableArea: numberText(property?.usableArea ?? null),
    totalArea: numberText(property?.totalArea ?? null),
    bedrooms: numberText(property?.bedrooms ?? null),
    bathrooms: numberText(property?.bathrooms ?? null),
    parkingSpaces: numberText(property?.parkingSpaces ?? null),
    ageInYears: numberText(property?.ageInYears ?? null),
    address: property?.address ?? "",
    commune: property?.commune ?? "",
    city: property?.city ?? "",
    region: property?.region ?? "",
    features: property?.features ?? [],
    isPublished: property?.isPublished ?? false,
    isFeatured: property?.isFeatured ?? false,
  };
}

/** Typed number; a decimal comma is accepted. Text that is not a number becomes NaN, which the schema rejects. */
const toNumber = (text: string) => Number(text.trim().replace(",", "."));
/** Empty means "does not apply" (null) for the optional numbers. */
const toOptionalNumber = (text: string) => (text.trim() === "" ? null : toNumber(text));

/** Validates the form with the shared contract; returns the request body or one message per field. */
export function validatePropertyForm(
  values: PropertyFormValues,
): { success: true; data: PropertyInputData } | { success: false; errors: PropertyFormErrors } {
  const parsed = propertyInputSchema.safeParse({
    ...values,
    operationType: values.operationType || undefined,
    propertyType: values.propertyType || undefined,
    price: values.price.trim() === "" ? undefined : toNumber(values.price),
    usableArea: toOptionalNumber(values.usableArea),
    totalArea: toOptionalNumber(values.totalArea),
    bedrooms: toOptionalNumber(values.bedrooms),
    bathrooms: toOptionalNumber(values.bathrooms),
    parkingSpaces: toOptionalNumber(values.parkingSpaces),
    ageInYears: toOptionalNumber(values.ageInYears),
  });
  if (parsed.success) return { success: true, data: parsed.data };

  const errors: PropertyFormErrors = {};
  for (const issue of parsed.error.issues) errors[issue.path[0] as PropertyFormField] ??= issue.message;
  return { success: false, errors };
}

/** Adds a feature unless it is empty or already listed (ignoring case). */
export function addFeature(features: string[], name: string): string[] {
  const trimmed = name.trim();
  const key = trimmed.toLocaleLowerCase("es");
  if (!trimmed || features.some((feature) => feature.toLocaleLowerCase("es") === key)) return features;
  return [...features, trimmed];
}

/** Features offered as checkboxes in the admin form, in this order. */
export const COMMON_FEATURES = [
  "Calefacción",
  "Jardín",
  "Piscina",
  "Quincho",
  "Seguridad",
  "Bodega",
  "Estacionamiento",
  "Terraza",
  "Ascensor",
  "Aire acondicionado",
  "Amoblado",
  "Conserjería",
] as const;

const featureKey = (name: string) => name.trim().toLocaleLowerCase("es");

/** Whether the list has the feature, ignoring case ("piscina" counts as "Piscina"). */
export function hasFeature(features: string[], name: string): boolean {
  return features.some((feature) => featureKey(feature) === featureKey(name));
}

/** Checks or unchecks a feature; unchecking removes it whatever its case. */
export function toggleFeature(features: string[], name: string, checked: boolean): string[] {
  return checked ? addFeature(features, name) : features.filter((feature) => featureKey(feature) !== featureKey(name));
}

/** Checkboxes to show: the common features first, then any other (stored or added), without repeating a name. */
export function buildFeatureOptions(otherNames: string[]): string[] {
  return otherNames.reduce<string[]>((options, name) => addFeature(options, name), [...COMMON_FEATURES]);
}
