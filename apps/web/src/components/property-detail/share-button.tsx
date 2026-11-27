"use client";

import { flash } from "@/lib/flash";

/** Shares the page with the device's share sheet, or copies the link when there is none. */
export function ShareButton({ title }: { title: string }) {
  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      flash("Enlace copiado.");
    } catch (error) {
      // Closing the share sheet is not an error.
      if (error instanceof DOMException && error.name === "AbortError") return;
      flash("No pudimos compartir el enlace. Cópialo desde la barra del navegador.", "error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-brass hover:bg-surface"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      </svg>
      Compartir
    </button>
  );
}
