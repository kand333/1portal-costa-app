import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { COMMUNE_NAMES } from "@/lib/communes";
import { COMMUNE_PROFILES } from "@/lib/commune-profiles";
import { CommuneShowcase } from "./commune-showcase";

describe("commune profiles", () => {
  it("has a photo, a line and qualities for every commune of the dial", () => {
    for (const name of COMMUNE_NAMES) {
      const profile = COMMUNE_PROFILES[name];
      expect(profile, name).toBeDefined();
      expect(profile.photo).toMatch(/^https:\/\/images\.unsplash\.com\//);
      expect(profile.tagline.length).toBeGreaterThan(0);
      expect(profile.qualities.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("CommuneShowcase", () => {
  it("shows the commune name, its qualities, a switcher with one pressed commune and a close button", () => {
    const html = renderToStaticMarkup(
      <CommuneShowcase name="Tomé" profile={COMMUNE_PROFILES["Tomé"]} origin={{ x: 48, y: 8 }} names={COMMUNE_NAMES} onSelect={() => {}} onClose={() => {}} />,
    );
    expect(html).toContain("Playas");
    expect(html).toContain('aria-label="Cerrar comuna"');
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(COMMUNE_NAMES.length - 1);
  });
});
