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
        const isLogin = item.href === "/login";
        return (
          <li key={item.href} className={cn(isLogin && orientation === "horizontal" && "ml-3")}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative block px-3 py-2 text-sm font-medium transition-colors duration-200",
                // Active page: a fine brass rule under the label instead of a filled pill.
                "after:absolute after:inset-x-3 after:bottom-0.5 after:h-px after:origin-left after:bg-brass after:transition-transform after:duration-300 after:content-['']",
                isActive ? "text-ink after:scale-x-100" : "text-muted hover:text-ink after:scale-x-0 hover:after:scale-x-100",
                isLogin &&
                  "rounded-full border border-line px-5 after:hidden hover:border-brass hover:bg-surface",
                orientation === "vertical" && "px-4 py-3 text-base after:inset-x-4",
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
