"use client";

import { FEATURE_NAME_MAX_LENGTH } from "@portal/shared/admin-property";
import { featureInputSchema, type AdminFeature } from "@portal/shared/feature";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createFeature, deleteFeature, renameFeature } from "@/lib/admin-features";
import { ADMIN_PROPERTIES_PATH } from "@/lib/admin-properties";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { flash } from "@/lib/flash";

type Status = { tone: "idle" | "busy" | "error"; message: string };

const inputClassName =
  "h-10 w-full min-w-0 rounded-xl border border-line bg-surface px-3 text-ink transition-colors duration-200 hover:border-brass/60 focus-visible:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40";
const buttonClassName =
  "inline-flex h-10 shrink-0 items-center rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:border-brass hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40";

const errorMessageOf = (error: unknown) =>
  error instanceof ApiClientError ? error.message : "No pudimos guardar el cambio. Inténtalo de nuevo.";

/** First validation message of a name, or null when it is valid. */
const nameProblem = (name: string) => {
  const parsed = featureInputSchema.safeParse({ name });
  return parsed.success ? null : (parsed.error.issues[0]?.message ?? "Nombre inválido");
};

/**
 * ADMIN feature catalog: add, rename and delete features. A feature used by an active property
 * cannot be deleted (remove it from those properties first); renaming applies wherever it is used.
 */
export function AdminFeatureCatalog({ features }: { features: AdminFeature[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [status, setStatus] = useState<Status>({ tone: "idle", message: "" });
  const isBusy = status.tone === "busy";

  async function run(action: () => Promise<unknown>, doneMessage: string, onDone?: () => void) {
    setStatus({ tone: "busy", message: "Guardando…" });
    try {
      await action();
      onDone?.();
      // Success goes to the flash at the top of the page; this line keeps only progress and errors.
      setStatus({ tone: "idle", message: "" });
      flash(doneMessage);
      router.refresh();
    } catch (error) {
      setStatus({ tone: "error", message: errorMessageOf(error) });
    }
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = nameProblem(newName);
    if (problem) return setStatus({ tone: "error", message: problem });
    void run(() => createFeature(newName.trim()), `Característica «${newName.trim()}» creada.`, () => setNewName(""));
  }

  function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const problem = nameProblem(editing.name);
    if (problem) return setStatus({ tone: "error", message: problem });
    void run(() => renameFeature(editing.id, editing.name.trim()), `Característica renombrada a «${editing.name.trim()}».`, () => setEditing(null));
  }

  function handleDelete(feature: AdminFeature) {
    if (!window.confirm(`¿Eliminar «${feature.name}» del catálogo?`)) return;
    void run(() => deleteFeature(feature.id), `Característica «${feature.name}» eliminada.`);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 sm:px-6">
      <Link
        href={ADMIN_PROPERTIES_PATH}
        className="inline-flex text-sm font-semibold text-muted underline decoration-brass decoration-1 underline-offset-4 transition-colors duration-200 hover:text-ink"
      >
        Volver a propiedades
      </Link>
      <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight text-ink">Características</h1>
      <p className="mt-2 text-lg text-muted">
        El catálogo que aparece como casillas en el formulario de cada propiedad. Renombrar una la cambia en todas las propiedades que la usan.
      </p>

      <form onSubmit={handleCreate} noValidate aria-label="Agregar característica" className="mt-8 flex gap-2">
        <label htmlFor="new-feature" className="sr-only">
          Nueva característica
        </label>
        <input
          id="new-feature"
          value={newName}
          maxLength={FEATURE_NAME_MAX_LENGTH}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Nueva característica, por ejemplo: Sauna"
          className={cn(inputClassName, "h-11 flex-1")}
        />
        <button
          type="submit"
          disabled={isBusy}
          className="h-11 shrink-0 rounded-full bg-accent px-6 font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover disabled:opacity-70"
        >
          Agregar
        </button>
      </form>

      <p
        role={status.tone === "error" ? "alert" : "status"}
        className={cn("mt-3 min-h-5 text-sm", status.tone === "error" ? "text-red-700 dark:text-red-400" : "font-medium text-ink")}
      >
        {status.message}
      </p>

      {features.length === 0 ? (
        <p className="mt-4 rounded-[1.25rem] border border-dashed border-line p-8 text-center text-muted">Aún no hay características.</p>
      ) : (
        <ul aria-label="Catálogo de características" className="mt-4 divide-y divide-line rounded-[1.25rem] border border-line bg-surface px-4 shadow-soft sm:px-6">
          {features.map((feature) => {
            const isEditing = editing?.id === feature.id;
            const usage = feature.propertyCount === 1 ? "1 propiedad" : `${feature.propertyCount} propiedades`;
            return (
              <li key={feature.id} className="flex flex-wrap items-center gap-3 py-3">
                {isEditing ? (
                  <form onSubmit={handleRename} noValidate className="flex min-w-0 flex-1 basis-64 gap-2">
                    <label htmlFor={`feature-${feature.id}`} className="sr-only">
                      Nuevo nombre de «{feature.name}»
                    </label>
                    <input
                      id={`feature-${feature.id}`}
                      value={editing.name}
                      maxLength={FEATURE_NAME_MAX_LENGTH}
                      onChange={(event) => setEditing({ id: feature.id, name: event.target.value })}
                      onKeyDown={(event) => event.key === "Escape" && setEditing(null)}
                      // The field replaces the button just pressed: keep the focus with the user.
                      autoFocus
                      className={cn(inputClassName, "flex-1")}
                    />
                    <button type="submit" disabled={isBusy} className={buttonClassName}>
                      Guardar
                    </button>
                    <button type="button" onClick={() => setEditing(null)} className={buttonClassName}>
                      Cancelar
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="min-w-40 flex-1">
                      <p className="break-words font-medium text-ink">{feature.name}</p>
                      <p className="text-sm text-muted">{feature.propertyCount === 0 ? "Sin uso" : `En ${usage}`}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setEditing({ id: feature.id, name: feature.name })}
                        aria-label={`Renombrar «${feature.name}»`}
                        className={buttonClassName}
                      >
                        Renombrar
                      </button>
                      <button
                        type="button"
                        disabled={isBusy || feature.propertyCount > 0}
                        onClick={() => handleDelete(feature)}
                        aria-label={`Eliminar «${feature.name}»`}
                        title={feature.propertyCount > 0 ? `Está en ${usage}: quítala de ellas antes de eliminarla` : undefined}
                        className={cn(buttonClassName, "hover:border-red-700 hover:text-red-700 dark:hover:border-red-400 dark:hover:text-red-400")}
                      >
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
