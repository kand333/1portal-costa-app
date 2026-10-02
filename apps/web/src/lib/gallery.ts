import type { PropertyImageDetail } from "@portal/shared/property";

/** Gallery order: the main photo first, then the rest by position. */
export function orderGalleryImages(images: PropertyImageDetail[]): PropertyImageDetail[] {
  return [...images].sort((first, second) => {
    if (first.isMain !== second.isMain) return first.isMain ? -1 : 1;
    return first.position - second.position;
  });
}

/** Moves through the photos in a loop: after the last comes the first, before the first, the last. */
export function stepGalleryIndex(currentIndex: number, step: number, count: number): number {
  if (count === 0) return 0;
  return (((currentIndex + step) % count) + count) % count;
}
