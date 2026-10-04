import { describe, expect, it } from "vitest";
import { buildAdminInquiriesApiPath, buildReplyMailto, parseAdminInquiryListParams } from "./admin-inquiries";

describe("admin inquiry list params", () => {
  it("reads the page and the search, with safe defaults", () => {
    expect(parseAdminInquiryListParams({ page: "2", search: " casa " })).toEqual({ page: 2, search: "casa" });
    expect(parseAdminInquiryListParams({ page: "x" })).toEqual({ page: 1, search: "" });
  });

  it("builds the API path without the defaults", () => {
    expect(buildAdminInquiriesApiPath({ page: 1, search: "" })).toBe("/api/admin/inquiries");
    expect(buildAdminInquiriesApiPath({ page: 3, search: "ana" })).toBe("/api/admin/inquiries?search=ana&page=3");
  });
});

describe("buildReplyMailto", () => {
  it("opens an email to the visitor with the property in the subject", () => {
    expect(buildReplyMailto({ email: "ana@correo.cl", propertyTitle: "Casa en Ñuñoa" })).toBe(
      "mailto:ana@correo.cl?subject=Tu%20consulta%20sobre%20%C2%ABCasa%20en%20%C3%91u%C3%B1oa%C2%BB",
    );
  });
});
