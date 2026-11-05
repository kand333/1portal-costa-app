import { COMMUNE_NAMES } from "./communes";
import { configuredSocialLinks, type SocialLink } from "./contact";
import { SITE_NAME } from "./property-metadata";
import { siteUrl } from "./site-url";

/** `+56912345678` from a WhatsApp number written with any separators, or `null` when it has no digits. */
function toInternationalPhone(rawNumber: string | undefined): string | null {
  const digits = (rawNumber ?? "").replace(/\D/g, "");
  return digits === "" ? null : `+${digits}`;
}

/**
 * schema.org `RealEstateAgent` for the brokerage. Only facts the site already states: name, URL, logo, the communes
 * it serves and the public WhatsApp number. No street address until the business supplies a real one.
 */
export function buildRealEstateAgentSchema(
  whatsappNumber: string | undefined = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  socialLinks: readonly SocialLink[] = configuredSocialLinks(),
) {
  const origin = siteUrl();
  const telephone = toInternationalPhone(whatsappNumber);
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: SITE_NAME,
    url: origin,
    logo: `${origin}/logo-mark.png`,
    areaServed: COMMUNE_NAMES.map((name) => ({ "@type": "City", name })),
    ...(telephone ? { telephone } : {}),
    ...(socialLinks.length > 0 ? { sameAs: socialLinks.map((link) => link.href) } : {}),
  };
}

/** Serializes JSON-LD for an inline script, escaping `<` so the data cannot close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
