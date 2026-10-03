"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/cn";
import { setFavorite } from "@/lib/favorites-client";

type FavoriteButtonProps = {
  propertyId: string;
  propertyTitle: string;
  /** `overlay`: round icon over a photo (cards). `inline`: icon with text (detail page). */
  variant: "overlay" | "inline";
};

function HeartIcon({ isFilled }: { isFilled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill={isFilled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.6 0 5.8 3.6 4.5 7.1-1.8 4.8-9.3 9.4-9.3 9.4Z" />
    </svg>
  );
}

const classNames = {
  overlay:
    "relative z-10 inline-flex size-11 items-center justify-center rounded-full border border-white/50 bg-white/80 text-[#121719] shadow-soft backdrop-blur-md transition-[background-color,transform,color] duration-200 hover:scale-105 hover:bg-white",
  inline:
    "inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-brass hover:bg-surface",
};

/** Saves a property in the user's favorites. Visitors are sent to the login and come back here. */
export function FavoriteButton({ propertyId, propertyTitle, variant }: FavoriteButtonProps) {
  const pathname = usePathname();
  const { data: favorites, isLoggedIn, isAdmin, isUserLoading } = useFavorites();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);

  const isFavorite = Boolean(favorites?.some((property) => property.id === propertyId));

  // Saving properties is for USER accounts; an administrator does not see the button.
  if (isAdmin) return null;

  const label = isFavorite ? "Guardada" : "Guardar";

  if (!isLoggedIn && !isUserLoading) {
    return (
      <Link
        href={`/login?${new URLSearchParams({ next: pathname ?? "/" })}`}
        aria-label={`Ingresa para guardar «${propertyTitle}»`}
        title="Ingresa para guardar"
        className={classNames[variant]}
      >
        <HeartIcon isFilled={false} />
        {variant === "inline" && "Guardar"}
      </Link>
    );
  }

  async function handleClick() {
    setIsSaving(true);
    setError(false);
    try {
      await setFavorite(propertyId, !isFavorite);
    } catch {
      setError(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      // Disabled until the saved list is known, so the first click cannot do the opposite.
      disabled={isSaving || favorites === undefined}
      aria-pressed={isFavorite}
      aria-label={variant === "overlay" ? `Guardar «${propertyTitle}» en favoritos` : undefined}
      title={error ? "No pudimos guardar el cambio. Inténtalo de nuevo." : isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={cn(
        classNames[variant],
        // Saved: brass heart. The overlay always sits on a light chip, so it uses the light-theme brass.
        isFavorite && (variant === "overlay" ? "text-[#7a6238]" : "text-brass-text"),
        "disabled:cursor-wait",
      )}
    >
      <HeartIcon isFilled={isFavorite} />
      {variant === "inline" && label}
      {error && <span className="sr-only"> No pudimos guardar el cambio.</span>}
    </button>
  );
}
