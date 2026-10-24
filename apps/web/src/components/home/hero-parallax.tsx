"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Moves every `[data-depth]` descendant on scroll by `depth` times the scrolled distance, so layers
 * drift at different speeds. It only writes `transform`; with reduced motion the layers stay put.
 */
export function HeroParallax({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]"));
    let frame = 0;

    function update() {
      frame = 0;
      const distance = Math.min(window.scrollY, window.innerHeight);
      for (const layer of layers) {
        layer.style.transform = `translate3d(0, ${distance * Number(layer.dataset.depth)}px, 0)`;
      }
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
