import type { PropertySummary } from "@portal/shared/property";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFavorites } from "@/hooks/use-favorites";
import { SavedProperties } from "./saved-properties";

vi.mock("next/navigation", () => ({ usePathname: () => "/account" }));
vi.mock("@/hooks/use-favorites", () => ({ useFavorites: vi.fn() }));

const property: PropertySummary = {
  id: "5eed0000-0000-4000-8000-000000000001",
  title: "Casa con piscina",
  operationType: "SALE",
  propertyType: "HOUSE",
  price: 890000,
  currency: "USD",
  usableArea: 320,
  totalArea: 650,
  bedrooms: 5,
  bathrooms: 4,
  commune: "Lo Barnechea",
  city: "Santiago",
  region: "Región Metropolitana",
  isFeatured: true,
  mainImageUrl: null,
  createdAt: "2026-09-16T12:00:00.000Z",
};

const mockFavorites = (value: Partial<ReturnType<typeof useFavorites>>) =>
  vi.mocked(useFavorites).mockReturnValue({
    isLoggedIn: true,
    isUserLoading: false,
    isLoading: false,
    error: undefined,
    mutate: vi.fn(),
    ...value,
  } as ReturnType<typeof useFavorites>);

beforeEach(() => vi.mocked(useFavorites).mockReset());

describe("SavedProperties", () => {
  it("shows placeholders while the list loads", () => {
    mockFavorites({ data: undefined, isLoading: true });
    expect(renderToStaticMarkup(<SavedProperties />)).toContain('aria-label="Cargando tus propiedades guardadas"');
  });

  it("invites to explore the catalog when nothing is saved", () => {
    mockFavorites({ data: [] });
    const html = renderToStaticMarkup(<SavedProperties />);
    expect(html).toContain("Aún no tienes propiedades guardadas.");
    expect(html).toContain('href="/properties"');
  });

  it("lists the saved properties as cards linking to their detail", () => {
    mockFavorites({ data: [property] });
    const html = renderToStaticMarkup(<SavedProperties />);
    expect(html).toContain("Casa con piscina");
    expect(html).toContain(`href="/properties/${property.id}"`);
    expect(html).not.toContain("Aún no tienes propiedades guardadas.");
  });
});
