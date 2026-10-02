"use client";

import type { PropertyImageDetail } from "@portal/shared/property";
import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { orderGalleryImages, stepGalleryIndex } from "@/lib/gallery";

type PropertyGalleryProps = {
  images: PropertyImageDetail[];
  /** Describes the property in each photo's alt text, e.g. "Casa en Lo Barnechea: Casa con piscina". */
  imageDescription: string;
};

const arrowButtonClassName =
  "absolute top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/75 text-[#121719] shadow-soft backdrop-blur-md transition-[background-color,transform] duration-200 hover:scale-105 hover:bg-white";

/** Main photo with previous/next buttons, thumbnails and arrow-key navigation. */
export function PropertyGallery({ images, imageDescription }: PropertyGalleryProps) {
  const orderedImages = orderGalleryImages(images);
  const [activeIndex, setActiveIndex] = useState(0);
  const count = orderedImages.length;
  // Images can change after a refresh; never point past the last one.
  const currentIndex = Math.min(activeIndex, Math.max(count - 1, 0));
  const activeImage = orderedImages[currentIndex];

  if (!activeImage) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-[1.75rem] bg-line/40 text-muted sm:aspect-[16/8]">
        Sin fotografía
      </div>
    );
  }

  const hasSeveral = count > 1;
  const showStep = (step: number) => setActiveIndex(stepGalleryIndex(currentIndex, step, count));

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowLeft") showStep(-1);
    else if (event.key === "ArrowRight") showStep(1);
  }

  return (
    <section aria-label="Galería de fotos" onKeyDown={hasSeveral ? handleKeyDown : undefined}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] bg-line/40 sm:aspect-[16/8]">
        <Image
          // A new key per photo restarts the fade-in.
          key={activeImage.id}
          src={activeImage.url}
          alt={`${imageDescription}. Foto ${currentIndex + 1} de ${count}`}
          fill
          sizes="(min-width: 1280px) 1216px, 100vw"
          className="animate-[gallery-fade_0.5s_ease-out] object-cover"
          preload={currentIndex === 0}
        />
        {hasSeveral && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => showStep(-1)}
              className={cn(arrowButtonClassName, "left-4")}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={() => showStep(1)}
              className={cn(arrowButtonClassName, "right-4")}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <p
              aria-live="polite"
              className="absolute bottom-4 right-4 rounded-full bg-[#121719]/65 px-3.5 py-1 text-sm font-medium text-white tabular-nums backdrop-blur-md"
            >
              {`${currentIndex + 1} / ${count}`}
            </p>
          </>
        )}
      </div>

      {hasSeveral && (
        // Scrolls sideways on small screens instead of wrapping into several rows.
        <ul className="mt-4 flex snap-x gap-3 overflow-x-auto pb-1">
          {orderedImages.map((image, index) => {
            const isActive = index === currentIndex;
            return (
              <li key={image.id} className="shrink-0 snap-start">
                <button
                  type="button"
                  aria-label={`Ver foto ${index + 1} de ${count}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "relative block h-16 w-24 overflow-hidden rounded-xl transition-opacity duration-200 sm:h-20 sm:w-30",
                    isActive
                      ? "ring-2 ring-brass ring-offset-2 ring-offset-paper"
                      : "opacity-60 hover:opacity-100",
                  )}
                >
                  <Image src={image.url} alt="" fill sizes="120px" className="object-cover" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
