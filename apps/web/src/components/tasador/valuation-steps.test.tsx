import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AmenitiesStep } from "./amenities-step";
import { ValuationGate } from "./valuation-gate";

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
    for (const label of ["Piscina", "Gimnasio", "Conserjería", "Jardín", "Calefacción", "Bodega"]) {
      expect(html).toContain(label);
    }
    expect(html).not.toContain("Piscina temperada");
    expect(html.match(/type="checkbox"/g)).toHaveLength(6);
    expect(html).toContain("Atrás");
    expect(html).toContain("Estimar precio");
  });

  it("pins the actions to the bottom so «Estimar precio» is always in reach", () => {
    expect(render()).toMatch(/class="[^"]*\bsticky\b[^"]*\bbottom-0\b[^"]*"[^>]*>\s*<button[^>]*>Atrás/);
  });

  it("checks the selected ones and shows progress and errors", () => {
    expect(render(["pool"]).match(/checked=""/g)).toHaveLength(1);
    expect(render([], true)).toContain("Calculando…");
    expect(render([], false, "No pudimos calcular el precio")).toContain('role="alert"');
  });
});

describe("ValuationGate", () => {
  const gate = () => renderToStaticMarkup(<ValuationGate onSubmit={async () => null} onBack={() => undefined} />);

  it("asks only for name and email before showing the price", () => {
    const html = gate();
    expect(html).toContain("Tu tasación está lista");
    expect(html).toContain("Nombre");
    expect(html).toContain("Correo");
    expect(html).toContain("Ver mi tasación");
    expect(html).not.toContain("Teléfono");
    expect(html).not.toContain("Precio estimado");
  });

  it("lets the person go back to the amenities", () => {
    expect(gate()).toContain("Atrás");
  });
});
