"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { operationLabels, propertyTypeLabels } from "@/lib/property-format";
import { buildPropertySearchHref } from "@/lib/property-search";

const fieldClassName =
  "h-12 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function PropertySearchForm() {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Without JavaScript the native GET submission to /properties still works.
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    router.push(
      buildPropertySearchHref({
        search: String(formData.get("search") ?? ""),
        operation: String(formData.get("operation") ?? ""),
        type: String(formData.get("type") ?? ""),
      }),
    );
  }

  return (
    <form
      action="/properties"
      method="get"
      role="search"
      aria-label="Buscar propiedades"
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] dark:bg-zinc-950/90"
    >
      <div className="sm:col-span-2 lg:col-span-1">
        <label htmlFor="search" className="sr-only">
          Comuna, ciudad o palabra clave
        </label>
        <input
          id="search"
          name="search"
          type="search"
          placeholder="Comuna, ciudad o palabra clave"
          className={fieldClassName}
        />
      </div>
      <div>
        <label htmlFor="operation" className="sr-only">
          Operación
        </label>
        <select id="operation" name="operation" defaultValue="" className={fieldClassName}>
          <option value="">Comprar o arrendar</option>
          <option value="SALE">{operationLabels.SALE}</option>
          <option value="RENT">{operationLabels.RENT}</option>
        </select>
      </div>
      <div>
        <label htmlFor="type" className="sr-only">
          Tipo de propiedad
        </label>
        <select id="type" name="type" defaultValue="" className={fieldClassName}>
          <option value="">Todos los tipos</option>
          {Object.entries(propertyTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="h-12 rounded-lg bg-sky-700 px-6 font-semibold text-white hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:col-span-2 lg:col-span-1"
      >
        Buscar
      </button>
    </form>
  );
}
