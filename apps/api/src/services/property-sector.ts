import { normalizeSearchText } from "@/lib/normalize-search-text";

/** A sector of the reference table, as far as naming a property's neighbourhood needs it. */
export type NamedSector = { name: string; commune: string };

type PropertyText = { title: string; address: string; description: string; commune: string };

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Names a sector can be recognised and shown by: «Centro de Concepción» → «Centro» (the commune suffix is dropped) and
 * «Barrio Oriente - Las Tres Pascualas» → both parts.
 */
export function sectorAliases(sectorName: string, commune: string): string[] {
  const suffix = new RegExp(`\\s+de\\s+${escapeRegExp(commune)}$`, "i");
  return sectorName
    .split(" - ")
    .map((part) => part.trim().replace(suffix, "").trim())
    .filter((part) => part.length > 0);
}

/**
 * The sector a listing mentions in its title, address or description, among the sectors of its own commune, or null.
 * Properties have no coordinates, so this only recognises a neighbourhood the text names: it never guesses.
 * Whole words, no accents or case; the longest name wins.
 */
export function detectSector(property: PropertyText, sectors: readonly NamedSector[]): string | null {
  const text = normalizeSearchText(`${property.title} ${property.address} ${property.description}`);
  const commune = normalizeSearchText(property.commune);
  let best: string | null = null;
  for (const sector of sectors) {
    if (normalizeSearchText(sector.commune) !== commune) continue;
    for (const alias of sectorAliases(sector.name, sector.commune)) {
      const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(normalizeSearchText(alias))}(?![\\p{L}\\p{N}])`, "u");
      if (pattern.test(text) && (best === null || alias.length > best.length)) best = alias;
    }
  }
  return best;
}
