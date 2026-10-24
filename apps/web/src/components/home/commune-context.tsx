"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type CommuneContextValue = { commune: string; setCommune: (commune: string) => void };

const CommuneContext = createContext<CommuneContextValue>({ commune: "", setCommune: () => {} });

/** The commune picked on the dial or in a form, shared by every lead form of the page. */
export function CommuneProvider({ children, initialCommune = "" }: { children: ReactNode; initialCommune?: string }) {
  const [commune, setCommune] = useState(initialCommune);
  const value = useMemo(() => ({ commune, setCommune }), [commune]);
  return <CommuneContext.Provider value={value}>{children}</CommuneContext.Provider>;
}

export const useCommune = () => useContext(CommuneContext);
