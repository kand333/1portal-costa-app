"use client";

import "leaflet/dist/leaflet.css";
import { divIcon } from "leaflet";
import { useEffect, useRef, useState, type FocusEvent } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { MapLocation } from "@/lib/property-location";

const HINT_DURATION_MS = 1500;

// Red GPS pin as inline SVG: no icon images to bundle. The anchor is the tip of the pin.
const redPinIcon = divIcon({
  className: "",
  html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42" aria-hidden="true"><path d="M16 1C7.7 1 1 7.6 1 15.8 1 27 16 41 16 41s15-14 15-25.2C31 7.6 24.3 1 16 1Z" fill="#dc2626" stroke="#ffffff" stroke-width="2"/><circle cx="16" cy="15.5" r="5.5" fill="#ffffff"/></svg>',
  iconSize: [32, 42],
  iconAnchor: [16, 41],
});

/** Turns wheel zoom on and off, and reports a click on the map. Must live inside MapContainer. */
function WheelZoomControl({ isEnabled, onMapClick }: { isEnabled: boolean; onMapClick: () => void }) {
  const map = useMap();
  useMapEvents({ click: onMapClick });
  useEffect(() => {
    if (isEnabled) map.scrollWheelZoom.enable();
    else map.scrollWheelZoom.disable();
  }, [map, isEnabled]);
  return null;
}

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Off by default so the page keeps scrolling over the map; a click on the map turns it on.
  const [isWheelZoomEnabled, setIsWheelZoomEnabled] = useState(false);
  const [isHintVisible, setIsHintVisible] = useState(false);

  // A click anywhere outside the map turns wheel zoom off again.
  useEffect(() => {
    if (!isWheelZoomEnabled) return;
    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsWheelZoomEnabled(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isWheelZoomEnabled]);

  useEffect(() => () => clearTimeout(hintTimer.current), []);

  function enableWheelZoom() {
    clearTimeout(hintTimer.current);
    setIsHintVisible(false);
    setIsWheelZoomEnabled(true);
  }

  // Focus leaving the map (e.g. tabbing away) turns wheel zoom off too.
  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsWheelZoomEnabled(false);
  }

  // Scrolling over the inactive map scrolls the page and briefly explains how to zoom.
  function handleWheel() {
    if (isWheelZoomEnabled) return;
    clearTimeout(hintTimer.current);
    setIsHintVisible(true);
    hintTimer.current = setTimeout(() => setIsHintVisible(false), HINT_DURATION_MS);
  }

  return (
    // MapContainer does not forward ARIA props, so the accessible name goes on a wrapper.
    <div ref={wrapperRef} role="region" aria-label={label} onWheel={handleWheel} onBlur={handleBlur} className="relative size-full">
      <MapContainer center={center} zoom={location.zoom} scrollWheelZoom={false} className="size-full">
        <WheelZoomControl isEnabled={isWheelZoomEnabled} onMapClick={enableWheelZoom} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={center} icon={redPinIcon} />
      </MapContainer>
      {/* Above Leaflet's panes (z-index up to 1000) and click-through, so it never blocks the map. */}
      <p
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-[1001] flex items-center justify-center bg-black/35 p-4 text-center text-sm font-semibold text-white transition-opacity duration-300 motion-reduce:transition-none ${isHintVisible ? "opacity-100" : "opacity-0"}`}
      >
        Haz clic en el mapa para hacer zoom con la rueda
      </p>
    </div>
  );
}
