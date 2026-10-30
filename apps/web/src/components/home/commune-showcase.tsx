"use client";

import Image from "next/image";
import type { CSSProperties, KeyboardEvent } from "react";
import type { CommuneProfile } from "@/lib/commune-profiles";

type CommuneShowcaseProps = {
  name: string;
  profile: CommuneProfile;
  /** Where the lens opens from, as a percentage of the panel (the pin of the commune on the map). */
  origin: { x: number; y: number };
  names: readonly string[];
  onSelect: (name: string) => void;
  onClose: () => void;
};

/** The opened commune: a full photo that blooms from its pin like a lens, with one line, a few qualities and a way to switch. */
export function CommuneShowcase({ name, profile, origin, names, onSelect, onClose }: CommuneShowcaseProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    onClose();
  }

  return (
    <div
      key={name}
      role="region"
      aria-label={`Comuna de ${name}`}
      onKeyDown={handleKeyDown}
      style={{ "--lx": `${origin.x}%`, "--ly": `${origin.y}%` } as CSSProperties}
      className="lens-open absolute inset-0 z-10 overflow-hidden bg-night text-white"
    >
      <div className="ken-burns absolute inset-0">
        <Image src={profile.photo} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
      </div>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-night/90 via-night/55 to-transparent" />

      <div className="absolute inset-x-0 top-0 flex items-center gap-2 p-3">
        <ul className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {names.map((other) => (
            <li key={other} className="shrink-0">
              <button
                type="button"
                ref={other === name ? (button) => button?.scrollIntoView?.({ inline: "center", block: "nearest" }) : undefined}
                aria-pressed={other === name}
                onClick={() => onSelect(other)}
                className={`h-11 rounded-full px-4 text-xs font-semibold backdrop-blur-md transition-colors duration-200 ${
                  other === name ? "bg-white text-ink" : "bg-black/30 text-white hover:bg-black/50"
                }`}
              >
                {other}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="Cerrar comuna"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-transform duration-200 hover:scale-105"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
        <p className="chip-in font-mono text-xs font-medium uppercase tracking-[0.2em] text-white/80" style={{ "--i": 0 } as CSSProperties}>
          Comuna
        </p>
        <h3 className="chip-in mt-2 font-display text-4xl leading-none sm:text-6xl" style={{ "--i": 1 } as CSSProperties}>
          {name}
        </h3>
        <p className="chip-in mt-3 text-lg text-white/85" style={{ "--i": 2 } as CSSProperties}>
          {profile.tagline}
        </p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {profile.qualities.map((quality, index) => (
            <li
              key={quality}
              style={{ "--i": index + 3 } as CSSProperties}
              className="chip-in rounded-full border border-white/40 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-md"
            >
              {quality}
            </li>
          ))}
        </ul>
        <a
          href="#cierre"
          className="chip-in mt-6 inline-flex h-12 items-center rounded-full bg-[image:var(--ember)] px-7 font-semibold text-white shadow-lift transition-transform duration-200 hover:-translate-y-0.5"
          style={{ "--i": 6 } as CSSProperties}
        >
          Tasar mi propiedad aquí
        </a>
      </div>
    </div>
  );
}
