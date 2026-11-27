import type { PropertyDetail } from "@portal/shared/property";
import { buildExecutiveCallUrl, buildExecutiveWhatsAppUrl } from "@/lib/property-executive";
import { PropertyPrice } from "./property-price";

type PropertyContactBarProps = {
  property: Pick<PropertyDetail, "price" | "currency" | "operationType" | "title" | "code">;
};

/** Phones only: price and the three ways to reach the executive, fixed to the bottom of the screen. */
export function PropertyContactBar({ property }: PropertyContactBarProps) {
  const buttonClassName =
    "flex h-11 flex-1 items-center justify-center rounded-full border border-ink/25 px-3 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink";
  return (
    <div
      id="property-contact-bar"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
    >
      <PropertyPrice price={property.price} currency={property.currency} operationType={property.operationType} size="compact" />
      <div className="mt-2 flex gap-2">
        <a href={buildExecutiveCallUrl()} className={buttonClassName}>
          Llamar
        </a>
        <a href={buildExecutiveWhatsAppUrl(property)} target="_blank" rel="noopener noreferrer" className={buttonClassName}>
          WhatsApp
        </a>
        <a href="#contact-title" className="flex h-11 flex-[1.3] items-center justify-center rounded-full bg-accent px-3 text-sm font-bold text-on-accent shadow-soft">
          Agendar visita
        </a>
      </div>
    </div>
  );
}
