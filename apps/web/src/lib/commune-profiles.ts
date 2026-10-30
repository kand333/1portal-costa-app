/**
 * What each commune of the dial shows when it is opened: a photo, one line and a few qualities.
 * The photos are Unsplash test images (generic Chilean-south landscapes, not the exact places);
 * replace them here with real ones. Qualities are qualitative on purpose: no figures.
 */
export type CommuneProfile = { photo: string; tagline: string; qualities: readonly string[] };

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=75`;

export const COMMUNE_PROFILES: Readonly<Record<string, CommuneProfile>> = {
  Concepción: {
    photo: photo("1477959858617-67f85cf4f1df"),
    tagline: "La capital regional del Biobío.",
    qualities: ["Capital regional", "Universidades", "Comercio y servicios"],
  },
  Talcahuano: {
    photo: photo("1518837695005-2083093ee35b"),
    tagline: "Puerto y bahía.",
    qualities: ["Puerto", "Bahía de Concepción", "Tradición naval"],
  },
  "San Pedro de la Paz": {
    photo: photo("1501785888041-af3ef285b470"),
    tagline: "Lagunas y barrios familiares.",
    qualities: ["Laguna Grande", "Barrios residenciales", "Junto al Biobío"],
  },
  Chiguayante: {
    photo: photo("1470071459604-3b5ec3a7fe05"),
    tagline: "Entre cerros y río.",
    qualities: ["Cerros", "Ribera del Biobío", "Cerca de Concepción"],
  },
  Hualpén: {
    photo: photo("1469474968028-56623f02e42e"),
    tagline: "Naturaleza a minutos del centro.",
    qualities: ["Parque Pedro del Río Zañartu", "Humedales", "Zona costera"],
  },
  Penco: {
    photo: photo("1507525428034-b723cf961d3e"),
    tagline: "Costa e historia.",
    qualities: ["Costa", "Historia fundacional", "Tranquilidad"],
  },
  Tomé: {
    photo: photo("1519046904884-53103b34b206"),
    tagline: "Playas y viñedos.",
    qualities: ["Playas", "Tradición vitivinícola", "Dichato"],
  },
  Hualqui: {
    photo: photo("1506744038136-46273834b3fb"),
    tagline: "Campo y río.",
    qualities: ["Entorno rural", "Río Biobío", "Terrenos amplios"],
  },
  Coronel: {
    photo: photo("1505142468610-359e7d316be0"),
    tagline: "Playa y herencia del carbón.",
    qualities: ["Playa Blanca", "Puerto", "Herencia minera"],
  },
  Lota: {
    photo: photo("1464822759023-fed622ff2c3b"),
    tagline: "Parque y patrimonio minero.",
    qualities: ["Parque de Lota", "Patrimonio minero", "Vista al mar"],
  },
};
