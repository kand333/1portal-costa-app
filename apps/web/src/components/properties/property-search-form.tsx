"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { operationLabels, propertyTypeLabels } from "@/lib/property-format";
import { buildPropertySearchHref } from "@/lib/property-search";

const fieldClassName =
  "h-14 w-full rounded-2xl border border-transparent bg-paper/70 px-4 text-ink transition-colors duration-200 hover:border-line focus-visible:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40";

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
      className="grid gap-2 rounded-[1.75rem] border border-white/50 bg-surface/80 p-2.5 shadow-lift backdrop-blur-2xl sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] dark:border-white/10"
    >
      <div className="sm:col-span-2 lg:col-span-1">
        <label htmlFor="search" className="sr-only">
          Comuna, ciudad o palabra clave
        </label>
        <input
          id="search"
          name="search"
          type="search"
          autoComplete="off"
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
        className="h-14 rounded-2xl bg-accent px-8 font-semibold text-on-accent transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-accent-hover active:translate-y-0 sm:col-span-2 lg:col-span-1"
      >
        Buscar
      </button>
    </form>
  );
}
