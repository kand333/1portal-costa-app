import type { UserInquiry } from "@portal/shared/inquiry";
import type { PropertySummary } from "@portal/shared/property";
import { afterEach, describe, expect, it, vi } from "vitest";
import { filterInquiries, inquiryTitle, paginateInquiries, removeMyInquiry } from "./my-inquiries";

const inquiry = (id: string, propertyTitle: string, message: string, currentTitle?: string): UserInquiry => ({
  id,
  propertyId: currentTitle ? `p-${id}` : null,
  propertyTitle,
  message,
  createdAt: "2026-09-01T12:00:00.000Z",
  adminReplyCount: 0,
  property: currentTitle ? ({ id: `p-${id}`, title: currentTitle } as PropertySummary) : null,
});

const inquiries = [
  inquiry("1", "Casa en Ñuñoa", "¿Aceptan mascotas?", "Casa renovada en Ñuñoa"),
  inquiry("2", "Depto en Providencia", "Quisiera coordinar una visita"),
  inquiry("3", "Oficina El Golf", "¿Incluye estacionamiento?", "Oficina El Golf"),
];

afterEach(() => vi.unstubAllGlobals());

describe("filterInquiries", () => {
  it("returns every inquiry without a search", () => {
    expect(filterInquiries(inquiries, "  ")).toBe(inquiries);
  });

  it("searches the property title (current or saved) and the message, ignoring case and accents", () => {
    const ids = (search: string) => filterInquiries(inquiries, search).map((item) => item.id);
    expect(ids("nunoa")).toEqual(["1"]);
    expect(ids("renovada")).toEqual(["1"]);
    expect(ids("VISITA")).toEqual(["2"]);
    expect(ids("golf estacionamiento")).toEqual(["3"]);
    expect(ids("golf mascotas")).toEqual([]);
  });
});

describe("inquiryTitle", () => {
  it("prefers the current title and falls back to the saved one", () => {
    expect(inquiryTitle(inquiries[0])).toBe("Casa renovada en Ñuñoa");
    expect(inquiryTitle(inquiries[1])).toBe("Depto en Providencia");
  });
});

describe("paginateInquiries", () => {
  const many = Array.from({ length: 14 }, (_, index) => inquiry(String(index), "Casa", "Mensaje de prueba"));

  it("splits the list in pages of 6", () => {
    expect(paginateInquiries(many, 1)).toMatchObject({ currentPage: 1, totalPages: 3 });
    expect(paginateInquiries(many, 3).items.map((item) => item.id)).toEqual(["12", "13"]);
  });

  it("keeps the page in range, with one page for an empty list", () => {
    expect(paginateInquiries(many, 9).currentPage).toBe(3);
    expect(paginateInquiries(many, 0).currentPage).toBe(1);
    expect(paginateInquiries([], 1)).toEqual({ items: [], currentPage: 1, totalPages: 1 });
  });
});

describe("removeMyInquiry", () => {
  it("sends DELETE to the account inquiry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(removeMyInquiry("i1")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/account/inquiries/i1", expect.objectContaining({ method: "DELETE" }));
  });
});
