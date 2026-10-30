import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarketPanel } from "./market-panel";

describe("market panel", () => {
  it("shows the sale tab first with its real count and links to the filtered catalog", () => {
    const html = renderToStaticMarkup(<MarketPanel sale={12} rent={7} />);
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain(">12<");
    expect(html).toContain('href="/properties?operation=SALE"');
  });

  it("omits a tab whose count is unknown and renders nothing when both are", () => {
    expect(renderToStaticMarkup(<MarketPanel sale={null} rent={3} />)).not.toContain("Venta");
    expect(renderToStaticMarkup(<MarketPanel sale={null} rent={null} />)).toBe("");
  });
});
