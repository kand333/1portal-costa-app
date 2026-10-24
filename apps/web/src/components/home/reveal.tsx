"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds to wait once visible, to stagger siblings. */
  delay?: number;
};

/** Wipes its content in once, when it first enters the viewport. Without JavaScript it is simply visible. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"visible" | "hidden" | "shown">("visible");

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Hide only after hydration, so the server HTML stays readable if scripts never run.
    setState("hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}s` }}
      className={`transition-[opacity,clip-path,transform] duration-700 ease-out ${
        state === "hidden" ? "translate-y-3 opacity-0 [clip-path:inset(0_100%_0_0)]" : "[clip-path:inset(0_0_0_0)]"
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
