import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithSession, findWithSession, getAdminUser } from "@/lib/session";
import AdminAccountPage from "../account/page";
import AdminInquiryPage from "./[id]/page";
import AdminInquiriesPage from "./page";

vi.mock("@/lib/session", () => ({ getAdminUser: vi.fn(), fetchWithSession: vi.fn(), findWithSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const admin = { id: "a1", name: "Admin Portal", email: "admin@test.com", role: "ADMIN" as const, isActive: true };
const inquiryId = "11111111-1111-4111-8111-111111111111";
const emptyList = { data: [], meta: { page: 1, pageSize: 12, total: 0, totalPages: 0 } };

const renderList = async (searchParams: Record<string, string>) =>
  renderToStaticMarkup(await AdminInquiriesPage({ searchParams: Promise.resolve(searchParams) } as PageProps<"/admin/inquiries">));
const renderDetail = async (id: string) =>
  renderToStaticMarkup(await AdminInquiryPage({ params: Promise.resolve({ id }) } as PageProps<"/admin/inquiries/[id]">));

beforeEach(() => {
  vi.mocked(getAdminUser).mockReset().mockResolvedValue(admin);
  vi.mocked(fetchWithSession).mockReset().mockResolvedValue(emptyList);
  vi.mocked(findWithSession).mockReset();
});

describe("admin inquiry and account pages", () => {
  it("lists the inquiries asking the API with the page and search of the URL", async () => {
    expect(await renderList({ page: "2", search: "ana" })).toContain("Consultas");
    expect(getAdminUser).toHaveBeenCalledWith("/admin/inquiries");
    expect(fetchWithSession).toHaveBeenCalledWith("/api/admin/inquiries?search=ana&page=2");
  });

  it("opens an inquiry, and answers 404 when it does not exist or the id is invalid", async () => {
    vi.mocked(findWithSession).mockResolvedValue({
      id: inquiryId,
      propertyId: null,
      propertyTitle: "Casa en Ñuñoa",
      isPropertyPublic: false,
      user: null,
      name: "Ana",
      email: "ana@test.com",
      phone: null,
      message: "¿Sigue disponible?",
      createdAt: "2026-10-01T12:00:00.000Z",
      hiddenByUser: false,
      messageCount: 0,
      lastActivityAt: "2026-10-01T12:00:00.000Z",
      awaitingReply: true,
      messages: [],
    });
    expect(await renderDetail(inquiryId)).toContain("Consulta de Ana");
    expect(findWithSession).toHaveBeenCalledWith(`/api/admin/inquiries/${inquiryId}`);

    vi.mocked(findWithSession).mockResolvedValue(null);
    await expect(renderDetail(inquiryId)).rejects.toThrow("NEXT_NOT_FOUND");
    vi.mocked(findWithSession).mockClear();
    await expect(renderDetail("not-a-uuid")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(findWithSession).not.toHaveBeenCalled();
  });

  it("shows the administrator's own data and password forms in «Mi cuenta»", async () => {
    const html = renderToStaticMarkup(await AdminAccountPage());
    expect(html).toContain('value="Admin Portal"');
    expect(html).toContain("Cambiar contraseña");
    expect(getAdminUser).toHaveBeenCalledWith("/admin/account");
  });

  it("shows «Acceso restringido» to a non-admin in every page, without asking for the data", async () => {
    vi.mocked(getAdminUser).mockResolvedValue(null);
    expect(await renderList({})).toContain("Acceso restringido");
    expect(await renderDetail(inquiryId)).toContain("Acceso restringido");
    expect(renderToStaticMarkup(await AdminAccountPage())).toContain("Acceso restringido");
    expect(fetchWithSession).not.toHaveBeenCalled();
    expect(findWithSession).not.toHaveBeenCalled();
  });
});
