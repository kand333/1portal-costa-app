import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MobileCtaBar } from "./mobile-cta-bar";

describe("MobileCtaBar", () => {
  it("is always visible, says «VENDE CON NOSOTROS» and leads to /vender", () => {
    const html = renderToStaticMarkup(<MobileCtaBar />);
    expect(html).toContain("VENDE CON NOSOTROS");
    expect(html).toContain('href="/vender"');
    expect(html).not.toContain("aria-hidden");
    expect(html).not.toContain("translate-y-full");
  });

  it("can point to a form on the same page", () => {
    expect(renderToStaticMarkup(<MobileCtaBar href="#vender-form" />)).toContain('href="#vender-form"');
  });
});
