import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "@/components/layout/site-footer";
import PrivacyPage, { metadata } from "./page";

describe("privacy page", () => {
  it("states who is responsible, the contact email and the user's rights", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain("<h1");
    expect(html).toContain("Política de privacidad");
    expect(html).toContain("propizoom@gmail.com");
    expect(html).toContain("19.628");
  });

  it("is canonical at /privacidad and linked from the footer", () => {
    expect(metadata.alternates?.canonical).toBe("/privacidad");
    expect(renderToStaticMarkup(<SiteFooter />)).toContain('href="/privacidad"');
  });
});
