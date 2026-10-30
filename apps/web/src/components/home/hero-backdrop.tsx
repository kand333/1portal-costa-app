import Image from "next/image";
import type { CSSProperties } from "react";

// Test photos (Unsplash) of new buildings and interiors. Swap them here for the real ones.
const SLIDES = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=2200&q=80",
] as const;

type HeroBackdropProps = {
  /** An mp4 (e.g. `/video/portada.mp4`) that plays over the photos, muted and in a loop. Without it the photos carry the motion. */
  videoSrc?: string;
};

/** A full-bleed backdrop that feels like video: photos that drift (slow zoom) and cross-fade in a loop, or a real muted video when one is given. */
export function HeroBackdrop({ videoSrc }: HeroBackdropProps) {
  return (
    <>
      <div className="hero-slides absolute inset-0">
        {SLIDES.map((slide, index) => (
          <div key={slide} className="hero-slide absolute inset-0" style={{ "--slide": index } as CSSProperties}>
            <Image src={slide} alt="" fill sizes="100vw" className="object-cover" preload={index === 0} />
          </div>
        ))}
      </div>
      {videoSrc && (
        <video aria-hidden="true" className="absolute inset-0 size-full object-cover" src={videoSrc} poster={SLIDES[0]} muted loop autoPlay playsInline />
      )}
    </>
  );
}
