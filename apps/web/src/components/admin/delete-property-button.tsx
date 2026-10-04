"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiClientError, sendJson } from "@/lib/api-client";

type DeletePropertyButtonProps = {
  propertyId: string;
  propertyTitle: string;
};

/** Deletes a property after a confirmation, then reloads the list from the server. */
export function DeletePropertyButton({ propertyId, propertyTitle }: DeletePropertyButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!window.confirm(`¿Eliminar «${propertyTitle}»? Dejará de verse en el portal y pasará a «Eliminadas».`)) return;

    setIsDeleting(true);
    setError(null);
    try {
      await sendJson("DELETE", `/api/admin/properties/${propertyId}`);
      router.refresh();
    } catch (caught) {
      // Already deleted (e.g. from another tab): the list only needs refreshing.
      if (caught instanceof ApiClientError && caught.status === 404) {
        router.refresh();
        return;
      }
      setError(caught instanceof ApiClientError ? caught.message : "No fue posible eliminar la propiedad");
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDeleting}
        aria-label={`Eliminar «${propertyTitle}»`}
        className="inline-flex h-10 items-center rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:border-red-700 hover:text-red-700 dark:hover:border-red-400 dark:hover:text-red-400 disabled:cursor-wait disabled:opacity-60"
      >
        {isDeleting ? "Eliminando…" : "Eliminar"}
      </button>
      {error && (
        <p role="alert" className="basis-full text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </>
  );
}
