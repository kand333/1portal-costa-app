import type { PropertyDetail } from "@portal/shared/property";
import type { Metadata } from "next";
import { formatLocation, formatPrice, operationLabels, propertyTypeLabels } from "@/lib/property-format";

export const SITE_NAME = "Portal Inmobiliario";

/** Search engines show about 155–160 characters of a description. */
export const DESCRIPTION_MAX_LENGTH = 160;

/** Collapses whitespace and cuts at a word boundary, ending with "…" when shortened. */
export function truncateDescription(text: string, maxLength = DESCRIPTION_MAX_LENGTH): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength / 2 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:]+$/, "")}…`;
}

/** Open Graph's recommended size; social networks crop to about 1.91:1. */
export const SHARE_IMAGE_WIDTH = 1200;
export const SHARE_IMAGE_HEIGHT = 630;

/**
 * A 1200×630 JPEG of the image, made by its CDN: networks fetch a light file in a format they all read
 * (not the original upload, nor AVIF/WebP). Other sources are left as they are.
 */
export function toShareImageUrl(src: string): string {
  if (src.startsWith("https://res.cloudinary.com/") && src.includes("/image/upload/")) {
    return src.replace("/image/upload/", `/image/upload/c_fill,g_auto,w_${SHARE_IMAGE_WIDTH},h_${SHARE_IMAGE_HEIGHT},f_jpg,q_auto/`);
  }
  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    for (const [key, value] of Object.entries({ w: SHARE_IMAGE_WIDTH, h: SHARE_IMAGE_HEIGHT, fit: "crop", fm: "jpg", q: 80 })) {
      url.searchParams.set(key, String(value));
    }
    url.searchParams.delete("auto");
    return url.toString();
  }
  return src;
}

/** The image to share: the one marked as main, otherwise the first in the gallery order. */
const shareImageOf = ({ images }: PropertyDetail) =>
  images.find((image) => image.isMain) ?? [...images].sort((first, second) => first.position - second.position)[0];

/**
 * Metadata of a public property page: title, a description that leads with the key facts
 * (operation, type, price, location), the canonical URL and Open Graph / Twitter with the main image.
 */
export function buildPropertyMetadata(property: PropertyDetail): Metadata {
  const title = `${property.title} | ${SITE_NAME}`;
  const facts = [
    `${propertyTypeLabels[property.propertyType]} en ${operationLabels[property.operationType].toLowerCase()}`,
    formatPrice(property.price, property.currency, property.operationType),
    formatLocation(property.commune, property.city),
  ].join(" · ");
  const description = truncateDescription(`${facts}. ${property.description}`);
  const url = `/properties/${property.id}`;
  const image = shareImageOf(property);
  const imageUrl = image ? toShareImageUrl(image.url) : undefined;
  const images = imageUrl ? [{ url: imageUrl, width: SHARE_IMAGE_WIDTH, height: SHARE_IMAGE_HEIGHT, alt: property.title }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: SITE_NAME, locale: "es_CL", url, title, description, images },
    twitter: { card: imageUrl ? "summary_large_image" : "summary", title, description, images: imageUrl ? [imageUrl] : undefined },
  };
}
