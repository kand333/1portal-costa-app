"use client";

import "leaflet/dist/leaflet.css";
import { divIcon } from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import type { MapLocation } from "@/lib/property-location";

// Same pin as the property detail map, inline so there are no icon images to bundle.
const redPinIcon = divIcon({
  className: "",
  html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42" aria-hidden="true"><path d="M16 1C7.7 1 1 7.6 1 15.8 1 27 16 41 16 41s15-14 15-25.2C31 7.6 24.3 1 16 1Z" fill="#dc2626" stroke="#ffffff" stroke-width="2"/><circle cx="16" cy="15.5" r="5.5" fill="#ffffff"/></svg>',
  iconSize: [32, 42],
  iconAnchor: [16, 41],
});

/** MapContainer ignores later `center` changes, so the view follows the location from inside it. */
function FollowLocation({ location, reduceMotion }: { location: MapLocation; reduceMotion: boolean }) {
  const map = useMap();
  useEffect(() => {
    const target: [number, number] = [location.latitude, location.longitude];
    if (reduceMotion) map.setView(target, location.zoom, { animate: false });
    else map.flyTo(target, location.zoom, { duration: 1.2 });
  }, [map, location, reduceMotion]);
  return null;
}

type ValuationMapCanvasProps = {
  location: MapLocation;
  /** Marks the point only once an address or commune was located. */
  showPin: boolean;
  label: string;
};

/** Leaflet map with OpenStreetMap tiles that follows the address being typed. Browser only. */
export default function ValuationMapCanvas({ location, showPin, label }: ValuationMapCanvasProps) {
  const center: [number, number] = [location.latitude, location.longitude];
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <div role="region" aria-label={label} className="size-full">
      <MapContainer center={center} zoom={location.zoom} scrollWheelZoom={false} className="size-full">
        <FollowLocation location={location} reduceMotion={reduceMotion} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {showPin && <Marker position={center} icon={redPinIcon} keyboard={false} interactive={false} />}
      </MapContainer>
    </div>
  );
}
