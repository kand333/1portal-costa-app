"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { CommuneMapCanvasProps } from "./commune-map-canvas";

// Leaflet uses `window` when it is imported, so the map only loads in the browser.
const CommuneMapCanvas = dynamic(() => import("./commune-map-canvas"), {
  ssr: false,
  loading: () => <div role="status" aria-label="Cargando mapa" className="size-full animate-pulse bg-sand" />,
});

/** Mounts the map only when it is about to be seen, so the home page does not request tiles on load. */
export function CommuneMap(props: CommuneMapCanvasProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsNear(true);
        observer.disconnect();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className="isolate size-full bg-sand">{isNear && <CommuneMapCanvas {...props} />}</div>;
}
