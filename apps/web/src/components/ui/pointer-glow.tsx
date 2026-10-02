"use client";

import type { PointerEvent, ReactNode } from "react";

type PointerGlowProps = {
  className?: string;
  children: ReactNode;
};

/**
 * Wrapper that publishes the pointer position as `--x`/`--y` for the `.glow-spot` and `.glow-ring`
 * layers (see globals.css). It only writes CSS variables, so it never re-renders; touch input and
 * reduced motion are ignored by the CSS.
 */
export function PointerGlow({ className, children }: PointerGlowProps) {
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const { left, top } = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--x", `${event.clientX - left}px`);
    event.currentTarget.style.setProperty("--y", `${event.clientY - top}px`);
  }

  return (
    <div className={`glow-host ${className ?? ""}`} onPointerMove={handlePointerMove}>
      {children}
    </div>
  );
}
