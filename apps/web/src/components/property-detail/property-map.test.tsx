import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PropertyMap } from "./property-map";

const query = "Av. Apoquindo 4500, Las Condes, Santiago, Región Metropolitana, Chile";
const location = { latitude: -33.41, longitude: -70.57, zoom: 17 };
const googleMapsHref = 'href="https://www.google.com/maps/search/?api=1&amp;query=Av.+Apoquindo+4500';

describe("PropertyMap", () => {
  it("reserves the map area and loads Leaflet only in the browser", () => {
    const html = renderToStaticMarkup(<PropertyMap query={query} location={location} />);
    expect(html).toContain("Cargando mapa…");
    expect(html).not.toContain("leaflet-container");
    expect(html).toContain("isolate");
  });

  it("links to Google Maps below the map, with no OpenStreetMap link", () => {
    const html = renderToStaticMarkup(<PropertyMap query={query} location={location} />);
    expect(html).toContain(googleMapsHref);
    expect(html.indexOf("Abrir en Google Maps")).toBeGreaterThan(html.indexOf("Cargando mapa"));
    expect(html).toMatch(/<div class="mt-4 flex justify-end"><a href="https:\/\/www\.google\.com\/maps/);
    expect(html).not.toContain("openstreetmap.org/search");
    expect(html).not.toContain("Abrir en OpenStreetMap");
  });

  it("shows only the Google Maps link when the address could not be located", () => {
    const html = renderToStaticMarkup(<PropertyMap query={query} location={null} />);
    expect(html).not.toContain("Cargando mapa");
    expect(html).toContain(googleMapsHref);
  });

  it("opens Google Maps in a new tab, announcing it", () => {
    const html = renderToStaticMarkup(<PropertyMap query={query} location={null} />);
    expect(html).toContain("Abrir en Google Maps");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("se abre en una pestaña nueva");
  });
});
