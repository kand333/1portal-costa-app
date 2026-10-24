/**
 * Identity of the report: name, tagline and colors. The logo is drawn as vectors in `report-components.ts`
 * from these values, so changing the brand (or swapping in an image logo) touches only this folder.
 */
export const REPORT_BRAND = {
  name: "Portal Inmobiliario",
  tagline: "Valoración referencial para propietarios del Gran Concepción",
  colors: {
    navy: "#12355B",
    turquoise: "#14A3A8",
    turquoiseDark: "#0B7478",
    turquoiseSoft: "#E3F4F5",
    paper: "#F4F8FA",
    line: "#D5E0E6",
    ink: "#1B2733",
    muted: "#5B6B7A",
    white: "#FFFFFF",
    warning: "#8A5A00",
    warningSoft: "#FFF4DB",
  },
} as const;

/** US Letter in PDF points, with the margins every page respects. */
export const PAGE = {
  width: 612,
  height: 792,
  margin: 54,
  /** Space kept free at the bottom for the footer. */
  footerHeight: 44,
} as const;

export const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;
