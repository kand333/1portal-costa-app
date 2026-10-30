"use client";

import "leaflet/dist/leaflet.css";
import { divIcon, latLngBounds, type FitBoundsOptions, type LatLngTuple } from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { COVERAGE_COMMUNES, type CoverageCommune } from "@/lib/communes";

// One place to change the tile provider if the traffic ever outgrows the OpenStreetMap policy.
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const COMMUNE_ZOOM = 13;
const HUB = COVERAGE_COMMUNES[0];
const BOUNDS = latLngBounds(COVERAGE_COMMUNES.map((commune): LatLngTuple => [commune.latitude, commune.longitude]));
const BOUNDS_OPTIONS: FitBoundsOptions = { padding: [36, 36] };

export type CommuneMapCanvasProps = {
  /** The commune being highlighted (by the scroll tour or the choice), if any. */
  activeName: string | null;
  /** The commune the map flies to; null shows the whole area. */
  pinnedName: string | null;
  reduceMotion: boolean;
  onSelect: (name: string) => void;
  /** The map finished moving to the pinned commune. */
  onSettled: (name: string) => void;
};

function pinIcon(name: string, isActive: boolean) {
  return divIcon({
    className: "",
    html: `<div class="map-pin${isActive ? " map-pin-active" : ""}"><span class="map-pin-dot"></span>${name}</div>`,
    iconSize: [0, 0],
  });
}

/** A gentle arc between two points, so the lines read as a network and not as straight roads. */
function arc(from: CoverageCommune, to: CoverageCommune): LatLngTuple[] {
  const midLat = (from.latitude + to.latitude) / 2;
  const midLng = (from.longitude + to.longitude) / 2;
  const bend = 0.18;
  const control: LatLngTuple = [midLat + (to.longitude - from.longitude) * bend, midLng - (to.latitude - from.latitude) * bend];
  return Array.from({ length: 21 }, (_, index) => {
    const t = index / 20;
    const u = 1 - t;
    return [
      u * u * from.latitude + 2 * u * t * control[0] + t * t * to.latitude,
      u * u * from.longitude + 2 * u * t * control[1] + t * t * to.longitude,
    ];
  });
}

/** Moves the map: the whole area by default, flying to the commune when one is pinned. */
function MapDirector({ pinnedName, reduceMotion, onSettled }: Pick<CommuneMapCanvasProps, "pinnedName" | "reduceMotion" | "onSettled">) {
  const map = useMap();
  const settledRef = useRef(onSettled);
  useEffect(() => {
    settledRef.current = onSettled;
  });

  // The map lives inside a pinned frame: keep its size in sync.
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    const commune = COVERAGE_COMMUNES.find((item) => item.name === pinnedName);
    if (!commune) {
      if (reduceMotion) map.fitBounds(BOUNDS, { ...BOUNDS_OPTIONS, animate: false });
      else map.flyToBounds(BOUNDS, { ...BOUNDS_OPTIONS, duration: 1 });
      return;
    }
    const target: LatLngTuple = [commune.latitude, commune.longitude];
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      map.off("moveend", finish);
      settledRef.current(commune.name);
    };
    if (reduceMotion) {
      map.setView(target, COMMUNE_ZOOM, { animate: false });
      finish();
      return;
    }
    map.on("moveend", finish);
    map.flyTo(target, COMMUNE_ZOOM, { duration: 1.2 });
    const fallback = window.setTimeout(finish, 1800);
    return () => {
      done = true;
      map.off("moveend", finish);
      window.clearTimeout(fallback);
    };
  }, [map, pinnedName, reduceMotion]);

  return null;
}

/** Leaflet map of Gran Concepción with a pin per commune and a network of arcs from the hub. Browser only. */
export default function CommuneMapCanvas({ activeName, pinnedName, reduceMotion, onSelect, onSettled }: CommuneMapCanvasProps) {
  const arcs = useMemo(() => COVERAGE_COMMUNES.slice(1).map((commune) => ({ commune, points: arc(HUB, commune) })), []);

  return (
    <div role="region" aria-label="Mapa del Gran Concepción" className="commune-map size-full">
      <MapContainer
        bounds={BOUNDS}
        boundsOptions={BOUNDS_OPTIONS}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomSnap={0.25}
        className="size-full"
      >
        <MapDirector pinnedName={pinnedName} reduceMotion={reduceMotion} onSettled={onSettled} />
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} className="map-tiles" />
        {arcs.map(({ commune, points }) => {
          const isActive = activeName === commune.name;
          return (
            <Polyline
              key={commune.name}
              positions={points}
              interactive={false}
              pathOptions={{ color: "#f56908", weight: isActive ? 3 : 1.5, opacity: isActive ? 1 : 0.5, className: isActive ? "map-arc map-arc-active" : "map-arc" }}
            />
          );
        })}
        {COVERAGE_COMMUNES.map((commune) => {
          const isActive = activeName === commune.name;
          return (
            <Marker
              key={commune.name}
              position={[commune.latitude, commune.longitude]}
              icon={pinIcon(commune.name, isActive)}
              title={commune.name}
              zIndexOffset={isActive ? 1000 : 0}
              eventHandlers={{ click: () => onSelect(commune.name) }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
