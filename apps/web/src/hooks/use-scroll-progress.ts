"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * How far the element has scrolled through the viewport, from 0 (its top reaches the top of the
 * viewport) to 1 (its bottom reaches the bottom). Stays 0 when `enabled` is false.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>, enabled: boolean): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;
    let frame = 0;

    function update() {
      frame = 0;
      if (!element) return;
      const { top, height } = element.getBoundingClientRect();
      const scrollable = height - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(1, Math.max(0, -top / scrollable)) : 0);
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref, enabled]);

  return enabled ? progress : 0;
}
