import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildRealEstateAgentSchema, serializeJsonLd } from "./agent-schema";
import { COMMUNE_NAMES } from "./communes";

describe("agent schema", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://propizoom.example/");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("describes the brokerage with the zone it serves and its WhatsApp number", () => {
    const schema = buildRealEstateAgentSchema("+56 9 1234 5678");
    expect(schema).toMatchObject({
      "@type": "RealEstateAgent",
      name: "PropiZoom",
      url: "https://propizoom.example",
      logo: "https://propizoom.example/logo-mark.png",
      telephone: "+56912345678",
    });
    expect(schema.areaServed.map((area) => area.name)).toEqual([...COMMUNE_NAMES]);
  });

  it("omits the phone when there is no number and never invents an address", () => {
    const schema = buildRealEstateAgentSchema(undefined, []);
    expect(schema).not.toHaveProperty("telephone");
    expect(schema).not.toHaveProperty("address");
    expect(schema).not.toHaveProperty("sameAs");
  });

  it("lists the configured social profiles in sameAs", () => {
    const schema = buildRealEstateAgentSchema(undefined, [
      { network: "instagram", label: "Instagram", href: "https://www.instagram.com/propizoom" },
    ]);
    expect(schema.sameAs).toEqual(["https://www.instagram.com/propizoom"]);
  });

  it("escapes < so the data cannot close the script tag", () => {
    expect(serializeJsonLd({ name: "</script><b>" })).not.toContain("</script>");
  });
});
