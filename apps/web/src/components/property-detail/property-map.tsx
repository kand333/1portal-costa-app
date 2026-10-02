import { buildGoogleMapsUrl, type MapLocation } from "@/lib/property-location";
import { PropertyMapLoader } from "./property-map-loader";

type PropertyMapProps = {
  /** Address text (see `buildMapQuery`). */
  query: string;
  /** Geocoded point; without it only the link to Google Maps is shown. */
  location: MapLocation | null;
};

/** Location of the property on OpenStreetMap, built from its address (no coordinates entered by hand). */
export function PropertyMap({ query, location }: PropertyMapProps) {
  return (
    <div>
      {location && (
        // `isolate z-0` keeps Leaflet's panes (z-index 400+) below the sticky header.
        <div className="relative isolate z-0 aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-line bg-line/40 sm:aspect-[16/9]">
          <PropertyMapLoader location={location} label={`Mapa de ubicación: ${query}`} />
        </div>
      )}
      {/* Right-aligned, under the right edge of the map. */}
      <div className="mt-4 flex justify-end">
        <a
          href={buildGoogleMapsUrl(query)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-sm font-semibold text-ink underline decoration-brass decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
        >
          Abrir en Google Maps<span className="sr-only"> (se abre en una pestaña nueva)</span>
        </a>
      </div>
    </div>
  );
}
