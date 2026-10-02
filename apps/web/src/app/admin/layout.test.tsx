import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminUser } from "@/lib/session";
import AdminLayout from "./layout";
import AdminPage from "./page";

vi.mock("@/lib/session", () => ({ getAdminUser: vi.fn() }));

const admin = { id: "a1", name: "Admin", email: "admin@test.com", role: "ADMIN" as const, isActive: true };

const renderLayout = async () =>
  renderToStaticMarkup(await AdminLayout({ children: <p>Contenido de administración</p> } as LayoutProps<"/admin">));
const renderPage = async () => renderToStaticMarkup(await AdminPage());

beforeEach(() => vi.mocked(getAdminUser).mockReset());

describe("admin section", () => {
  it("shows the layout content and the page to an ADMIN", async () => {
    vi.mocked(getAdminUser).mockResolvedValue(admin);
    expect(await renderLayout()).toContain("Contenido de administración");
    expect(await renderPage()).toContain("Panel de administración");
    expect(getAdminUser).toHaveBeenCalledWith("/admin");
  });

  it("shows «Acceso restringido» instead of the content to a non-admin, in the layout and in the page", async () => {
    vi.mocked(getAdminUser).mockResolvedValue(null);

    const layout = await renderLayout();
    expect(layout).toContain("Acceso restringido");
    expect(layout).not.toContain("Contenido de administración");

    // The page checks on its own: the layout alone does not keep its content out of the response.
    const page = await renderPage();
    expect(page).toContain("Acceso restringido");
    expect(page).not.toContain("Panel de administración");
  });
});
