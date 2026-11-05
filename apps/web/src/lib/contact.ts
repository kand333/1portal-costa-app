export const CONTACT_EMAIL = "propizoom@gmail.com";

/** "+56 9 2059 3331" for a Chilean mobile number; "+digits" for any other; null when there are no digits. */
export function formatWhatsAppNumber(raw: string | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits === "") return null;
  const chileanMobile = /^569(\d{4})(\d{4})$/.exec(digits);
  return chileanMobile ? `+56 9 ${chileanMobile[1]} ${chileanMobile[2]}` : `+${digits}`;
}

export type SocialNetwork = "facebook" | "youtube" | "instagram";

export type SocialLink = { network: SocialNetwork; label: string; href: string };

const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  facebook: "Facebook",
  youtube: "YouTube",
  instagram: "Instagram",
};

/** Only the networks whose URL is set and starts with `https://`: a missing or malformed one is never shown. */
export function getSocialLinks(urls: Partial<Record<SocialNetwork, string | undefined>>): SocialLink[] {
  return (Object.keys(SOCIAL_LABELS) as SocialNetwork[]).flatMap((network) => {
    const href = urls[network]?.trim() ?? "";
    return /^https:\/\/\S+$/.test(href) ? [{ network, label: SOCIAL_LABELS[network], href }] : [];
  });
}

/** The configured social links, read from the public env variables. */
export function configuredSocialLinks(): SocialLink[] {
  return getSocialLinks({
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL,
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL,
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
  });
}
