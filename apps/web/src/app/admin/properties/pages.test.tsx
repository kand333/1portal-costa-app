import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithSession, findWithSession, getAdminUser } from "@/lib/session";
import EditAdminPropertyPage from "./[id]/edit/page";
import AdminFeaturesPage from "./features/page";
import NewAdminPropertyPage from "./new/page";
import AdminPropertiesPage from "./page";

vi.mock("@/lib/session", () => ({ getAdminUser: vi.fn(), fetchWithSession: vi.fn(), findWithSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const admin = { id: "a1", name: "Admin", email: "admin@test.com", role: "ADMIN" as const, isActive: true };
const propertyId = "11111111-1111-4111-8111-111111111111";
const storedProperty = {
  id: propertyId,
  title: "Casa en Ñuñoa",
  description: "Casa familiar con jardín.",
  operationType: "SALE",
  propertyType: "HOUSE",
  price: 250000,
  currency: "USD",
  usableArea: null,
  totalArea: null,
  bedrooms: 3,
  bathrooms: 2,
  parkingSpaces: null,
  ageInYears: null,
  address: "Av. Prueba 1",
  commune: "Ñuñoa",
  city: "Santiago",
  region: "Región Metropolitana",
  features: [],
  images: [],
  isPublished: false,
  isFeatured: false,
};
const emptyList = { data: [], meta: { page: 2, pageSize: 12, total: 0, totalPages: 0 } };

const renderList = async (searchParams: Record<string, string>) =>
  renderToStaticMarkup(await AdminPropertiesPage({ searchParams: Promise.resolve(searchParams) } as PageProps<"/admin/properties">));
const renderEdit = async (id: string, searchParams: Record<string, string> = {}) =>
  renderToStaticMarkup(
    await EditAdminPropertyPage({
      params: Promise.resolve({ id }),
      searchParams: Promise.resolve(searchParams),
    } as PageProps<"/admin/properties/[id]/edit">),
  );

beforeEach(() => {
  vi.mocked(getAdminUser).mockReset().mockResolvedValue(admin);
  // The feature catalog is a list; every other admin call here answers a page.
  vi.mocked(fetchWithSession)
    .mockReset()
    .mockImplementation(async (path: string) =>
      path === "/api/admin/features" ? [{ id: "f1", name: "Sauna", propertyCount: 0 }] : emptyList,
    );
  vi.mocked(findWithSession).mockReset();
});

describe("admin property pages", () => {
  it("lists the properties asking the API with the page and search of the URL", async () => {
    expect(await renderList({ page: "2", search: " casa " })).toContain("Propiedades");
    expect(getAdminUser).toHaveBeenCalledWith("/admin/properties");
    expect(fetchWithSession).toHaveBeenCalledWith("/api/admin/properties?search=casa&page=2");
    await renderList({ status: "deleted", city: "santiago", minPrice: "100" });
    expect(fetchWithSession).toHaveBeenCalledWith("/api/admin/properties?status=deleted&minPrice=100&city=santiago");
    // The city filter is filled with the cities of the published properties.
    expect(fetchWithSession).toHaveBeenCalledWith("/api/properties/filter-options");
  });

  it("shows «Acceso restringido» to a non-admin in every page, without asking for the data", async () => {
    vi.mocked(getAdminUser).mockResolvedValue(null);
    expect(await renderList({})).toContain("Acceso restringido");
    expect(renderToStaticMarkup(await NewAdminPropertyPage())).toContain("Acceso restringido");
    expect(renderToStaticMarkup(await AdminFeaturesPage())).toContain("Acceso restringido");
    expect(await renderEdit(propertyId)).toContain("Acceso restringido");
    expect(fetchWithSession).not.toHaveBeenCalled();
    expect(findWithSession).not.toHaveBeenCalled();
  });

  it("opens the new property page", async () => {
    const html = renderToStaticMarkup(await NewAdminPropertyPage());
    expect(html).toContain("Nueva propiedad");
    expect(html).toContain("Crear propiedad");
    expect(getAdminUser).toHaveBeenCalledWith("/admin/properties/new");
    // The catalog's features are offered as checkboxes too.
    expect(html).toMatch(/type="checkbox"[^>]*\/><span[^>]*>Sauna<\/span>/);
  });

  it("loads the property to edit, and answers 404 when it does not exist or the id is invalid", async () => {
    vi.mocked(findWithSession).mockResolvedValue(storedProperty);
    const html = await renderEdit(propertyId);
    expect(html).toContain("Editar propiedad");
    expect(html).toContain('value="Casa en Ñuñoa"');
    expect(findWithSession).toHaveBeenCalledWith(`/api/admin/properties/${propertyId}`);

    vi.mocked(findWithSession).mockResolvedValue(null);
    await expect(renderEdit(propertyId)).rejects.toThrow("NEXT_NOT_FOUND");

    vi.mocked(findWithSession).mockClear();
    await expect(renderEdit("not-a-uuid")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(findWithSession).not.toHaveBeenCalled();
  });

  it("shows the feature catalog", async () => {
    const html = renderToStaticMarkup(await AdminFeaturesPage());
    expect(html).toContain(">Características</h1>");
    expect(html).toContain("Sauna");
    expect(getAdminUser).toHaveBeenCalledWith("/admin/properties/features");
    expect(fetchWithSession).toHaveBeenCalledWith("/api/admin/features");
  });
});
