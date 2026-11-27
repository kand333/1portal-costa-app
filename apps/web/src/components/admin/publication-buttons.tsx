"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiClientError, sendJson } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { flash } from "@/lib/flash";

type PublicationButtonsProps = {
  propertyId: string;
  propertyTitle: string;
  isPublished: boolean;
};

const buttonClassName =
  "inline-flex h-9 items-center rounded-full border px-4 text-sm font-semibold transition-colors duration-200 disabled:cursor-wait";

/**
 * «Publicado» / «Sin publicar»: the current state is green (published) or plain and dim (unpublished);
 * the other button changes it. Reloads the list from the server afterwards.
 */
export function PublicationButtons({ propertyId, propertyTitle, isPublished }: PublicationButtonsProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: boolean) {
    if (next === isPublished || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await sendJson("PATCH", `/api/admin/properties/${propertyId}/publication`, { isPublished: next });
      flash(next ? `«${propertyTitle}» ya está publicada en el portal.` : `«${propertyTitle}» quedó sin publicar.`);
      router.refresh();
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.status === 404) {
        router.refresh();
        return;
      }
      setError(caught instanceof ApiClientError ? caught.message : "No fue posible cambiar la publicación");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div role="group" aria-label={`Publicación de «${propertyTitle}»`} className="flex flex-wrap items-center gap-2 sm:justify-end">
      <button
        type="button"
        aria-pressed={isPublished}
        onClick={() => change(true)}
        disabled={isSaving}
        className={cn(
          buttonClassName,
          isPublished
            ? "border-success bg-success/12 text-success"
            : "border-line text-muted opacity-50 hover:border-success hover:text-success hover:opacity-100",
        )}
      >
        Publicado
      </button>
      <button
        type="button"
        aria-pressed={!isPublished}
        onClick={() => change(false)}
        disabled={isSaving}
        className={cn(
          buttonClassName,
          isPublished
            ? "border-line text-muted opacity-50 hover:border-brass hover:text-ink hover:opacity-100"
            : "border-ink/40 bg-paper text-ink",
        )}
      >
        Sin publicar
      </button>
      {error && (
        <p role="alert" className="basis-full text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
