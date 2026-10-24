import type { ValuationRequest, ValuationResult } from "@portal/shared/valuation";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AmenitiesStep } from "./amenities-step";
import { ContactOfferDialog } from "./contact-offer-dialog";

const request: ValuationRequest = {
  address: "Barros Arana 1000",
  commune: "Concepción",
  propertyType: "APARTMENT",
  operation: "SALE",
  totalArea: 80,
  usableArea: 70,
  bedrooms: 3,
  bathrooms: 2,
  parkingSpaces: 1,
  amenities: [],
};
const result: ValuationResult = { status: "insufficient" };

describe("AmenitiesStep", () => {
  const render = (selected: ("pool" | "gym")[] = [], isSending = false, errorMessage = "") =>
    renderToStaticMarkup(
      <AmenitiesStep
        selected={selected}
        onToggle={() => undefined}
        onBack={() => undefined}
        onSubmit={() => undefined}
        isSending={isSending}
        errorMessage={errorMessage}
      />,
    );

  it("lists the six amenities as checkboxes and both actions", () => {
    const html = render();
    for (const label of ["Piscina", "Gimnasio", "Conserjería", "Jardín", "Calefacción", "Piscina temperada"]) {
      expect(html).toContain(label);
    }
    expect(html.match(/type="checkbox"/g)).toHaveLength(6);
    expect(html).toContain("Atrás");
    expect(html).toContain("Estimar precio");
  });

  it("checks the selected ones and shows progress and errors", () => {
    expect(render(["pool"]).match(/checked=""/g)).toHaveLength(1);
    expect(render([], true)).toContain("Calculando…");
    expect(render([], false, "No pudimos calcular el precio")).toContain('role="alert"');
  });
});

describe("ContactOfferDialog", () => {
  const dialog = (startWithForm: boolean) =>
    renderToStaticMarkup(<ContactOfferDialog estimate={{ request, result }} startWithForm={startWithForm} onClose={() => undefined} />);

  it("offers contact or just the price", () => {
    const html = dialog(false);
    expect(html).toContain("Tu precio está listo");
    expect(html).toContain("Quiero que me contacten");
    expect(html).toContain("No, solo quiero saber el precio");
  });

  it("opens straight on the contact form from the summary button", () => {
    const html = dialog(true);
    expect(html).toContain("Deja tus datos");
    expect(html).toContain("Enviar solicitud");
    expect(html).toContain("Volver al precio");
  });

  it("renders nothing inside while there is no estimate", () => {
    const html = renderToStaticMarkup(<ContactOfferDialog estimate={null} startWithForm={false} onClose={() => undefined} />);
    expect(html).not.toContain("Quiero que me contacten");
  });
});
