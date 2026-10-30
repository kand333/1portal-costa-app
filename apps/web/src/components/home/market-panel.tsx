"use client";

import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import { CountUp } from "@/components/home/count-up";
import { cn } from "@/lib/cn";

type Tab = { id: "SALE" | "RENT"; label: string; count: number; href: string; caption: string };

type MarketPanelProps = { sale: number | null; rent: number | null };

/** A card with two tabs and a big counter: what is published today, from the real catalog. */
export function MarketPanel({ sale, rent }: MarketPanelProps) {
  const tabs: Tab[] = [
    ...(sale === null ? [] : [{ id: "SALE" as const, label: "Venta", count: sale, href: "/properties?operation=SALE", caption: "propiedades en venta" }]),
    ...(rent === null ? [] : [{ id: "RENT" as const, label: "Arriendo", count: rent, href: "/properties?operation=RENT", caption: "propiedades en arriendo" }]),
  ];
  const [activeId, setActiveId] = useState<Tab["id"]>(tabs[0]?.id ?? "SALE");
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  if (!active) return null;

  // Tabs follow the WAI-ARIA pattern: arrows move between them, and only the selected one is in the tab order.
  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(tabs.findIndex((tab) => tab.id === activeId) + step + tabs.length) % tabs.length];
    setActiveId(next.id);
    document.getElementById(`market-tab-${next.id}`)?.focus();
  }

  return (
    <section aria-labelledby="market-title" className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
      <h2 id="market-title" className="sr-only">
        Publicado hoy
      </h2>
      <div className="rounded-[2rem] bg-surface p-6 shadow-lift sm:p-10">
        <div role="tablist" aria-label="Tipo de operación" className="inline-flex rounded-full bg-sand p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`market-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={tab.id === active.id}
              aria-controls="market-panel"
              tabIndex={tab.id === active.id ? 0 : -1}
              onKeyDown={handleTabKeyDown}
              onClick={() => setActiveId(tab.id)}
              className={cn(
                "h-11 rounded-full px-6 text-sm font-semibold transition-colors duration-200",
                tab.id === active.id ? "bg-ink text-paper" : "text-muted hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div id="market-panel" role="tabpanel" aria-labelledby={`market-tab-${active.id}`} className="mt-10 flex flex-wrap items-end justify-between gap-8">
          <p className="flex items-baseline gap-4">
            <span className="font-display text-[clamp(4.5rem,14vw,9rem)] leading-none text-brass lining-nums tabular-nums">
              <CountUp key={active.id} value={active.count} />
            </span>
            <span className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted">{active.caption}</span>
          </p>
          <Link
            href={active.href}
            className="inline-flex h-12 items-center rounded-lg bg-ink px-6 font-semibold text-paper transition-transform duration-200 hover:-translate-y-0.5"
          >
            Ver propiedades
          </Link>
        </div>
      </div>
    </section>
  );
}
