"use client";

import "leaflet/dist/leaflet.css";
import { divIcon } from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import type { MapLocation } from "@/lib/property-location";

// Red GPS pin as inline SVG: no icon images to bundle. The anchor is the tip of the pin.
const redPinIcon = divIcon({
  className: "",
  html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42" aria-hidden="true"><path d="M16 1C7.7 1 1 7.6 1 15.8 1 27 16 41 16 41s15-14 15-25.2C31 7.6 24.3 1 16 1Z" fill="#dc2626" stroke="#ffffff" stroke-width="2"/><circle cx="16" cy="15.5" r="5.5" fill="#ffffff"/></svg>',
  iconSize: [32, 42],
  iconAnchor: [16, 41],
});

type PropertyMapCanvasProps = {
  location: MapLocation;
  /** Accessible name of the map, e.g. "Mapa de ubicación: Av. Apoquindo 4500, …". */
  label: string;
};

/** Leaflet map with OpenStreetMap tiles. Browser only: loaded through `PropertyMapLoader`. */
export default function PropertyMapCanvas({
  location,
  label,
}: PropertyMapCanvasProps) {
  const center: [number, number] = [location.latitude, location.longitude];
  return (
    // MapContainer does not forward ARIA props, so the accessible name goes on a wrapper.
    <div role="region" aria-label={label} className="size-full">
      <MapContainer
        center={center}
        zoom={location.zoom}
        // The mouse wheel over the map zooms it (Leaflet cancels the page scroll while over the map).
        scrollWheelZoom
        className="size-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={center} icon={redPinIcon} />
      </MapContainer>
    </div>
  );
}
