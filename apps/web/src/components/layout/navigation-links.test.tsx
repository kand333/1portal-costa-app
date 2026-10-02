import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NavigationLinks } from "./navigation-links";

describe("NavigationLinks", () => {
  it("links to the login page without a session", () => {
    const html = renderToStaticMarkup(<NavigationLinks activeHref="/" orientation="horizontal" />);
    expect(html).toContain('href="/login"');
    expect(html).not.toContain("Salir");
  });

  it("shows the user's name and a logout button instead of «Ingresar» with a session", () => {
    const html = renderToStaticMarkup(
      <NavigationLinks activeHref="/" orientation="horizontal" userName="Ana Rojas" onLogout={() => undefined} />,
    );
    expect(html).not.toContain('href="/login"');
    expect(html).toContain("Ana Rojas");
    expect(html).toMatch(/<button type="button"[^>]*>Salir<\/button>/);
    // The other links stay.
    expect(html).toContain('href="/properties"');
  });
});
