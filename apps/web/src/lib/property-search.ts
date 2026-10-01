/** Fields of the public property search form. */
export type PropertySearchValues = {
  search?: string;
  operation?: string;
  type?: string;
};

/** Builds the catalog URL for a search, omitting empty values to keep URLs clean. */
export function buildPropertySearchHref(values: PropertySearchValues): string {
  const searchParams = new URLSearchParams();
  for (const [name, value] of Object.entries(values)) {
    const trimmedValue = value?.trim();
    if (trimmedValue) searchParams.set(name, trimmedValue);
  }
  const queryString = searchParams.toString();
  return queryString ? `/properties?${queryString}` : "/properties";
}

/** Builds the public REST URL for a list of properties. */
export function buildPropertiesApiUrl(query: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined) searchParams.set(name, String(value));
  }
  const queryString = searchParams.toString();
  return queryString ? `/api/properties?${queryString}` : "/api/properties";
}
