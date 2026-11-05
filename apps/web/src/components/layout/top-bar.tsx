import type { ReactNode } from "react";
import { buildWhatsAppUrl } from "@/components/layout/whatsapp-button";
import { CONTACT_EMAIL, configuredSocialLinks, formatWhatsAppNumber, type SocialNetwork } from "@/lib/contact";
import { fetchUfValue, formatUf } from "@/lib/uf-server";

const iconProps = { "aria-hidden": true, viewBox: "0 0 24 24", className: "size-4 shrink-0", fill: "currentColor" } as const;

const SOCIAL_ICONS: Record<SocialNetwork, ReactNode> = {
  facebook: (
    <svg {...iconProps}>
      <path d="M13.5 22v-8.2h2.8l.5-3.3h-3.3V8.4c0-.9.4-1.7 1.8-1.7h1.6V3.9S15.6 3.6 14.3 3.6c-2.6 0-4.3 1.6-4.3 4.4v2.5H7.2v3.3H10V22h3.5Z" />
    </svg>
  ),
  youtube: (
    <svg {...iconProps}>
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
    </svg>
  ),
  instagram: (
    <svg {...iconProps}>
      <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6Zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  ),
};

// Round hit area (44 px) around a 16 px icon: orange at rest, white on orange when hovered or focused.
const iconLinkClassName =
  "group/icon flex size-11 items-center justify-center text-accent transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white";
const iconBubbleClassName =
  "flex size-7 items-center justify-center rounded-full border border-accent/60 transition-colors duration-200 group-hover/icon:border-accent group-hover/icon:bg-accent group-hover/icon:text-white group-focus-visible/icon:bg-accent group-focus-visible/icon:text-white";
const textLinkClassName =
  "inline-flex min-h-11 items-center gap-2 whitespace-nowrap text-paper transition-colors duration-200 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white";

/** Contact strip above the menu: email, WhatsApp, today's UF and the social networks that are configured. Scrolls away. */
export async function TopBar() {
  const uf = await fetchUfValue();
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const whatsappLabel = formatWhatsAppNumber(whatsappNumber);
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, "Hola, quiero consultar por propiedades en PropiZoom.");
  const socialLinks = configuredSocialLinks();

  return (
    <div className="relative z-40 hidden bg-[var(--navy)] text-paper sm:block" style={{ height: "var(--top-bar-height)" }}>
      <div className="mx-auto flex h-full max-w-6xl items-center justify-center gap-x-1 sm:gap-x-5 px-3 text-xs font-medium sm:px-6">
        <div className="flex min-w-0 items-center justify-center gap-x-1 sm:gap-x-5">
          <a href={`mailto:${CONTACT_EMAIL}`} aria-label={`Escribir a ${CONTACT_EMAIL}`} className={textLinkClassName}>
            <svg {...iconProps} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0 text-accent">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <span className="hidden sm:inline">{CONTACT_EMAIL}</span>
          </a>
          {whatsappUrl && whatsappLabel && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={`Escribir por WhatsApp al ${whatsappLabel}`} className={textLinkClassName}>
              <svg {...iconProps} className="size-4 shrink-0 text-[#25D366]">
                <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35ZM12.05 21.8a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88Z" />
              </svg>
              <span>{whatsappLabel}</span>
            </a>
          )}
          {uf !== null && (
            <span className="hidden min-h-11 items-center gap-2 text-paper/90 md:inline-flex" title="Valor de la UF hoy">
              <span aria-hidden="true" className="h-4 w-px bg-paper/25" />
              {formatUf(uf)}
            </span>
          )}
        </div>
        {socialLinks.length > 0 && (
          <ul className="flex items-center">
            {socialLinks.map((link) => (
              <li key={link.network}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label} className={iconLinkClassName}>
                  <span className={iconBubbleClassName}>{SOCIAL_ICONS[link.network]}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
