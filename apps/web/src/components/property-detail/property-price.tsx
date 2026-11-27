"use client";

import { useUfValue } from "@/components/properties/uf-value-context";
import { formatClp, formatPrice, formatUfAmount, toUf } from "@/lib/property-format";
import type { Currency, OperationType } from "@portal/shared/enums";

type PropertyPriceProps = {
  price: number;
  currency: Currency;
  operationType: OperationType;
  /** `large` for the side card; `compact` for the phone bar. */
  size?: "large" | "compact";
};

/** Sales: UF in bold with the price in pesos beside it (pesos only when today's UF is unknown). Rentals: pesos per month. */
export function PropertyPrice({ price, currency, operationType, size = "large" }: PropertyPriceProps) {
  const uf = toUf(price, useUfValue());
  const mainClassName =
    size === "large" ? "font-display text-4xl font-bold tracking-tight text-brass-text sm:text-5xl" : "font-display text-2xl font-bold leading-none text-brass-text";
  const secondaryClassName = size === "large" ? "text-base text-muted" : "text-xs text-muted";

  if (operationType === "SALE" && uf !== null) {
    return (
      <p className="flex flex-wrap items-baseline gap-x-3 tabular-nums">
        <span className={mainClassName}>{formatUfAmount(uf)}</span>
        <span className={secondaryClassName}>{formatClp(price)}</span>
      </p>
    );
  }
  return (
    <p className={`${mainClassName} tabular-nums`}>
      {operationType === "SALE" ? formatClp(price) : formatPrice(price, currency, operationType)}
    </p>
  );
}
