/** The executive who answers about every property (the same one for all listings). */
export const PROPERTY_EXECUTIVE = {
  name: "Felipe Smith",
  role: "Ejecutivo de ventas",
  phone: "+56 9 2059 3331",
} as const;

/** `tel:` link to call the executive. */
export function buildExecutiveCallUrl(): string {
  return `tel:${PROPERTY_EXECUTIVE.phone.replace(/[^\d+]/g, "")}`;
}

/** WhatsApp link to the executive, with the listing title and code already in the message. */
export function buildExecutiveWhatsAppUrl(property: { title: string; code: number }): string {
  const message = `Hola ${PROPERTY_EXECUTIVE.name.split(" ")[0]}, me interesa la propiedad «${property.title}» (Cód. ${property.code}). ¿Me das más información?`;
  const digits = PROPERTY_EXECUTIVE.phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?${new URLSearchParams({ text: message }).toString()}`;
}
