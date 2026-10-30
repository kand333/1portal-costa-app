import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

// Test photos (Unsplash). Swap them here for the real ones.
const SHORTCUTS = [
  {
    href: "/properties?operation=SALE",
    label: "Nuevos en el Gran Concepción",
    title: "Proyectos nuevos",
    image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1400&q=80",
    className: "min-h-[26rem] lg:col-span-7 lg:row-span-2 lg:min-h-[34rem]",
  },
  {
    href: "/tasador-propiedades",
    label: "Gratis",
    title: "Tasación",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
    className: "min-h-[15rem] lg:col-span-5",
  },
  {
    href: "/#cierre",
    label: "Para dueños",
    title: "Corretaje tradicional",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1000&q=80",
    className: "min-h-[15rem] lg:col-span-5",
  },
] as const;

/** Big photo tiles on a hairline grid: the direct access to each service, right under the hero. */
export function ShortcutTiles() {
  return (
    <section aria-label="Accesos directos" className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <ul className="grid gap-px overflow-hidden rounded-[1.75rem] border border-line bg-line lg:grid-cols-12 lg:grid-rows-2">
        {SHORTCUTS.map((shortcut) => (
          <li key={shortcut.href} className={cn("relative bg-paper", shortcut.className)}>
            <div className="tile-in absolute inset-0">
              <Link href={shortcut.href} className="group absolute inset-0 block overflow-hidden">
                <Image
                  src={shortcut.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/80 to-transparent" aria-hidden="true" />
                <span className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4 text-white">
                  <span>
                    <span className="block font-mono text-xs font-medium uppercase tracking-[0.2em] text-white/80">
                      {shortcut.label}
                    </span>
                    <span className="mt-1 block font-display text-3xl sm:text-4xl">{shortcut.title}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[image:var(--ember)] transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </span>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
