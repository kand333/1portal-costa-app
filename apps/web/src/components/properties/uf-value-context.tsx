"use client";

import { createContext, useContext, type ReactNode } from "react";

const UfValueContext = createContext<number | null>(null);

/** Today's UF in pesos (fetched once by the site layout), or null when it is unknown. */
export function UfValueProvider({ value, children }: { value: number | null; children: ReactNode }) {
  return <UfValueContext.Provider value={value}>{children}</UfValueContext.Provider>;
}

export function useUfValue(): number | null {
  return useContext(UfValueContext);
}
