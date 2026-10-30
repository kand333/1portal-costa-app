/**
 * Communes of Gran Concepción covered by the home page. `latitude`/`longitude` are the approximate
 * centre of each commune, used to place its pin on the map of `CommuneDial`. The first one is the hub
 * the network lines of the map start from.
 */
export type CoverageCommune = { name: string; latitude: number; longitude: number };

export const COVERAGE_COMMUNES: readonly CoverageCommune[] = [
  { name: "Concepción", latitude: -36.827, longitude: -73.05 },
  { name: "San Pedro de la Paz", latitude: -36.843, longitude: -73.108 },
  { name: "Chiguayante", latitude: -36.926, longitude: -73.029 },
  { name: "Hualpén", latitude: -36.786, longitude: -73.093 },
  { name: "Talcahuano", latitude: -36.724, longitude: -73.117 },
  { name: "Penco", latitude: -36.741, longitude: -72.998 },
  { name: "Tomé", latitude: -36.617, longitude: -72.957 },
  { name: "Hualqui", latitude: -36.975, longitude: -72.939 },
  { name: "Coronel", latitude: -37.03, longitude: -73.157 },
  { name: "Lota", latitude: -37.089, longitude: -73.158 },
];

export const COMMUNE_NAMES: readonly string[] = COVERAGE_COMMUNES.map((commune) => commune.name);
