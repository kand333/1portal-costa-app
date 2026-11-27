import { leadCreateSchema } from "@portal/shared/lead";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildSellLead, buildSellMessage, SELL_LEAD_FALLBACK_EMAIL, SellLeadForm } from "./sell-lead-form";

const values = {
  commune: "Concepción",
  propertyType: "APARTMENT",
  estimatedValue: "100000000",
  timing: "Lo antes posible",
  name: "Ana Pérez",
  phone: "+56 9 1234 5678",
  email: "",
};

describe("SellLeadForm", () => {
  it("shows the fields of the sell form and its notes", () => {
    const html = renderToStaticMarkup(<SellLeadForm />);
    for (const text of [
      "¿En qué comuna está?",
      "Tipo de propiedad",
      "Valor estimado",
      "¿Cuándo quieres vender?",
      "Tu nombre",
      "Tu celular (WhatsApp)",
      "Quiero vender mi propiedad",
      "Sin costo ni compromiso. Un corredor te escribe por WhatsApp en menos de 24 horas hábiles.",
      "Usamos tus datos solo para responder tu solicitud.",
    ]) {
      expect(html).toContain(text);
    }
    expect(html).toContain('href="/privacidad"');
  });

  it("builds a valid lead with source «vender» and a technical email when none is given", () => {
    const lead = buildSellLead(values);
    expect(lead).toMatchObject({ kind: "VALUATION", source: "vender", commune: "Concepción", address: "Concepción", email: SELL_LEAD_FALLBACK_EMAIL });
    expect(leadCreateSchema.safeParse(lead).success).toBe(true);
  });

  it("keeps the email the person typed", () => {
    expect(buildSellLead({ ...values, email: "ana@correo.cl" }).email).toBe("ana@correo.cl");
  });

  it("puts value and timing in the message, and nothing when both are empty", () => {
    expect(buildSellMessage("100000000", "Lo antes posible")).toContain("Plazo: Lo antes posible");
    expect(buildSellMessage("100000000", "")).toMatch(/^Valor estimado: \$100\.000\.000$/);
    expect(buildSellMessage("", "")).toBeUndefined();
  });
});
