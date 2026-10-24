/**
 * Communes of Gran Concepción covered by the home page. `x`/`y` place each one on the schematic
 * map of `CommuneDial` (percent of its box, north up); they are an illustration, not cartography.
 */
export type CoverageCommune = { name: string; x: number; y: number };

export const COVERAGE_COMMUNES: readonly CoverageCommune[] = [
  { name: "Concepción", x: 47, y: 38 },
  { name: "San Pedro de la Paz", x: 44, y: 60 },
  { name: "Chiguayante", x: 64, y: 46 },
  { name: "Hualpén", x: 24, y: 50 },
  { name: "Talcahuano", x: 22, y: 28 },
  { name: "Penco", x: 44, y: 20 },
  { name: "Tomé", x: 48, y: 8 },
  { name: "Hualqui", x: 76, y: 64 },
  { name: "Coronel", x: 34, y: 80 },
  { name: "Lota", x: 22, y: 91 },
];

export const COMMUNE_NAMES: readonly string[] = COVERAGE_COMMUNES.map((commune) => commune.name);
