import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFavorites } from "@/hooks/use-favorites";
import { FavoriteButton } from "./favorite-button";

vi.mock("next/navigation", () => ({ usePathname: () => "/properties/abc" }));
vi.mock("@/hooks/use-favorites", () => ({ useFavorites: vi.fn() }));

const saved = { id: "p1" } as never;
const mockFavorites = (value: { data?: unknown[]; isLoggedIn: boolean; isAdmin?: boolean; isUserLoading?: boolean }) =>
  vi.mocked(useFavorites).mockReturnValue({ isUserLoading: false, ...value } as ReturnType<typeof useFavorites>);

const render = (variant: "overlay" | "inline" = "overlay") =>
  renderToStaticMarkup(<FavoriteButton propertyId="p1" propertyTitle="Casa con piscina" variant={variant} />);

beforeEach(() => vi.mocked(useFavorites).mockReset());

describe("FavoriteButton", () => {
  it("sends a visitor to the login, returning to the same page", () => {
    mockFavorites({ isLoggedIn: false });
    const html = render();
    expect(html).toContain('href="/login?next=%2Fproperties%2Fabc"');
    expect(html).toContain('aria-label="Ingresa para guardar «Casa con piscina»"');
    expect(html).not.toContain("<button");
  });

  it("is a toggle button, not pressed, when the property is not saved", () => {
    mockFavorites({ isLoggedIn: true, data: [] });
    const html = render();
    expect(html).toMatch(/<button type="button"[^>]*aria-pressed="false"/);
    expect(html).toContain('aria-label="Guardar «Casa con piscina» en favoritos"');
    expect(html).not.toContain(' disabled=""');
  });

  it("is pressed when the property is saved, with the text «Guardada» in the inline variant", () => {
    mockFavorites({ isLoggedIn: true, data: [saved] });
    expect(render()).toContain('aria-pressed="true"');
    expect(render("inline")).toMatch(/aria-pressed="true"[^>]*>.*Guardada<\/button>/);
  });

  it("stays disabled until the saved list is loaded, so the first click cannot do the opposite", () => {
    mockFavorites({ isLoggedIn: true, data: undefined });
    expect(render()).toMatch(/<button[^>]*disabled=""/);
  });

  it("is not shown to an administrator (favorites are for USER accounts)", () => {
    mockFavorites({ isLoggedIn: true, isAdmin: true });
    expect(render()).toBe("");
  });
});
