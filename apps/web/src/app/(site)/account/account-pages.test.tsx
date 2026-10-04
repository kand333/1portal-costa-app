import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findWithSession, requireCustomerUser } from "@/lib/session";
import AccountEditPage from "./edit/page";
import AccountInquiryPage from "./inquiries/[id]/page";
import AccountPage from "./page";

vi.mock("@/lib/session", () => ({ requireCustomerUser: vi.fn(), findWithSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/account",
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
// The account overview loads its lists in the browser.
vi.mock("@/hooks/use-favorites", () => ({ useFavorites: () => ({ isLoggedIn: true, isUserLoading: true }) }));
vi.mock("@/hooks/use-my-inquiries", () => ({ useMyInquiries: () => ({ isLoading: true, mutate: vi.fn() }) }));

const user = { id: "u1", name: "Ana García", email: "ana@test.com", role: "USER" as const, isActive: true };
const inquiryId = "11111111-1111-4111-8111-111111111111";
const renderInquiry = async (id: string) =>
  renderToStaticMarkup(await AccountInquiryPage({ params: Promise.resolve({ id }) } as PageProps<"/account/inquiries/[id]">));

beforeEach(() => {
  vi.mocked(requireCustomerUser).mockReset().mockResolvedValue(user);
  vi.mocked(findWithSession).mockReset();
});

describe("account pages", () => {
  it("are for USER accounts: each page sends an ADMIN to the matching admin page", async () => {
    await AccountPage();
    expect(requireCustomerUser).toHaveBeenLastCalledWith("/account");
    await AccountEditPage();
    expect(requireCustomerUser).toHaveBeenLastCalledWith("/account/edit", "/admin/account");
    vi.mocked(findWithSession).mockResolvedValue(null);
    await renderInquiry(inquiryId).catch(() => undefined);
    expect(requireCustomerUser).toHaveBeenLastCalledWith(`/account/inquiries/${inquiryId}`, "/admin/inquiries");
  });

  it("shows the conversation of one of the user's inquiries, with a box to answer", async () => {
    vi.mocked(findWithSession).mockResolvedValue({
      id: inquiryId,
      propertyId: null,
      propertyTitle: "Casa en Ñuñoa",
      message: "¿Sigue disponible?",
      createdAt: "2026-10-01T12:00:00.000Z",
      property: null,
      adminReplyCount: 1,
      messages: [{ id: "m1", fromAdmin: true, authorName: "Admin", body: "Sí, sigue disponible.", createdAt: "2026-10-01T13:00:00.000Z" }],
    });
    const html = await renderInquiry(inquiryId);
    expect(html).toContain("Sí, sigue disponible.");
    expect(html).toContain(">Portal Inmobiliario<");
    expect(html).toContain("Escribe un mensaje");
    expect(findWithSession).toHaveBeenCalledWith(`/api/account/inquiries/${inquiryId}`);
  });

  it("answers 404 for an inquiry that is not the user's or an invalid id", async () => {
    vi.mocked(findWithSession).mockResolvedValue(null);
    await expect(renderInquiry(inquiryId)).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(renderInquiry("x")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
