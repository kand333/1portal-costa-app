"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import type { PropertiesFallback } from "@/lib/properties-server";

/** Seeds the SWR cache with lists the server already loaded; the browser revalidates them after hydrating. */
export function PropertiesFallbackProvider({ fallback, children }: { fallback: PropertiesFallback; children: ReactNode }) {
  return <SWRConfig value={{ fallback }}>{children}</SWRConfig>;
}
