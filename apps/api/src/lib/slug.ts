import { normalizeSearchText } from "./normalize-search-text";

/**
 * URL-safe identifier of a location name, insensitive to case and accents:
 * "Las Condes" -> "las-condes", "Ñuñoa" -> "nunoa", "Región Metropolitana" -> "region-metropolitana".
 */
export function toSlug(text: string): string {
  return normalizeSearchText(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
