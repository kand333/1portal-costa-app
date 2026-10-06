import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import PropertyMapCanvas from "./property-map-canvas";

// Leaflet needs a browser: the map pieces are stand-ins that only record what they receive.
const markerProps = vi.hoisted(() => [] as Record<string, unknown>[]);
vi.mock("leaflet/dist/leaflet.css", () => ({}));
vi.mock("leaflet", () => ({ divIcon: () => ({}) }));
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: (props: Record<string, unknown>) => {
    markerProps.push(props);
    return null;
  },
  useMap: () => ({ scrollWheelZoom: { enable: vi.fn(), disable: vi.fn() } }),
  useMapEvents: () => null,
}));

describe("PropertyMapCanvas", () => {
  it("names the map region and keeps the pin out of the keyboard order (it has no action)", () => {
    const html = renderToStaticMarkup(
      <PropertyMapCanvas location={{ latitude: -33.41, longitude: -70.57, zoom: 17 }} label="Mapa de ubicación: Av. Apoquindo 4500" />,
    );
    expect(html).toContain('role="region" aria-label="Mapa de ubicación: Av. Apoquindo 4500"');
    expect(markerProps.at(-1)).toMatchObject({ keyboard: false, interactive: false });
  });
});
