"use client";

import dynamic from "next/dynamic";

// Leaflet uses `window` when it is imported, so the map only loads in the browser.
export const ValuationMapLoader = dynamic(() => import("./valuation-map-canvas"), {
  ssr: false,
  loading: () => (
    <div role="status" className="flex size-full items-center justify-center text-sm text-muted">
      Cargando mapa…
    </div>
  ),
});
