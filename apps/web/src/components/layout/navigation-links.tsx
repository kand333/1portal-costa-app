import Link from "next/link";
import { cn } from "@/lib/cn";
import { navigationItems } from "./navigation-items";

type NavigationLinksProps = {
  activeHref: string | null;
  orientation: "horizontal" | "vertical";
  onNavigate?: () => void;
};

export function NavigationLinks({ activeHref, orientation, onNavigate }: NavigationLinksProps) {
  return (
    <ul
      className={cn(
        "flex",
        orientation === "horizontal" ? "items-center gap-1" : "flex-col gap-1",
      )}
    >
      {navigationItems.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600",
                isActive
                  ? "bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white",
                orientation === "vertical" && "px-4 py-3 text-base",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
