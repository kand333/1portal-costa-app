"use client";

import type { PropertyImageDetail } from "@portal/shared/property";
import { MAX_PROPERTY_IMAGE_BYTES, MAX_PROPERTY_IMAGES, PROPERTY_IMAGE_TYPES } from "@portal/shared/property-image";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { orderGalleryImages } from "@/lib/gallery";
import {
  arrangePropertyImages,
  deletePropertyImage,
  makeMainImage,
  moveImage,
  uploadPropertyImage,
  validatePropertyImageFile,
} from "@/lib/property-images";

type Status = { tone: "idle" | "busy" | "success" | "error"; message: string };

type PropertyImagesProps = {
  propertyId: string;
  propertyTitle: string;
  images: PropertyImageDetail[];
};

const errorMessageOf = (error: unknown, fallback: string) => (error instanceof ApiClientError ? error.message : fallback);

const actionClassName =
  "inline-flex h-9 items-center justify-center rounded-full border border-line bg-surface px-3 text-xs font-semibold text-ink transition-colors duration-200 hover:border-brass disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Images of a property: upload one or several to Cloudinary, choose the main one, reorder and delete.
 * Shown in the public order (main first). Each change is saved at once and the gallery reloads.
 */
export function PropertyImages({ propertyId, propertyTitle, images }: PropertyImagesProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ tone: "idle", message: "" });
  const ordered = orderGalleryImages(images);
  const order = ordered.map((image) => image.id);
  const isBusy = status.tone === "busy";

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    if (files.length === 0) return;

    const problems: string[] = [];
    let uploaded = 0;
    for (const [index, file] of files.entries()) {
      setStatus({ tone: "busy", message: files.length > 1 ? `Subiendo ${index + 1} de ${files.length}…` : "Subiendo imagen…" });
      const problem = await validatePropertyImageFile(file);
      if (problem) {
        problems.push(`${file.name}: ${problem}`);
        continue;
      }
      try {
        await uploadPropertyImage(propertyId, file);
        uploaded += 1;
      } catch (error) {
        problems.push(`${file.name}: ${errorMessageOf(error, "no se pudo subir")}`);
      }
    }
    if (inputRef.current) inputRef.current.value = "";

    const summary = uploaded === 1 ? "1 imagen subida." : `${uploaded} imágenes subidas.`;
    setStatus(
      problems.length > 0
        ? { tone: "error", message: `${uploaded > 0 ? `${summary} ` : ""}${problems.join(" · ")}` }
        : { tone: "success", message: summary },
    );
    // The gallery is server-rendered.
    if (uploaded > 0) router.refresh();
  }

  async function run(action: () => Promise<unknown>, busyMessage: string, doneMessage: string) {
    setStatus({ tone: "busy", message: busyMessage });
    try {
      await action();
      setStatus({ tone: "success", message: doneMessage });
      router.refresh();
    } catch (error) {
      setStatus({ tone: "error", message: errorMessageOf(error, "No pudimos guardar el cambio. Inténtalo de nuevo.") });
    }
  }

  function saveOrder(nextOrder: string[], doneMessage: string) {
    if (nextOrder === order) return;
    void run(() => arrangePropertyImages(propertyId, nextOrder, nextOrder[0]), "Guardando…", doneMessage);
  }

  function handleDelete(image: PropertyImageDetail, number: number) {
    const warning = image.isMain ? " Es la principal: la siguiente pasará a serlo." : "";
    if (!window.confirm(`¿Eliminar la imagen ${number}? Se borra también de Cloudinary.${warning}`)) return;
    void run(() => deletePropertyImage(propertyId, image.id), "Eliminando imagen…", "Imagen eliminada.");
  }

  return (
    <section aria-labelledby="property-images-title" className="mt-10 rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft sm:p-8">
      <h2 id="property-images-title" className="font-display text-3xl font-semibold tracking-tight text-ink">
        Imágenes
      </h2>
      <p className="mt-1 text-muted">
        JPG, PNG o WebP de hasta {MAX_PROPERTY_IMAGE_BYTES / (1024 * 1024)} MB, máximo {MAX_PROPERTY_IMAGES}. La principal se muestra
        primero en el portal; la primera imagen propia reemplaza a las de ejemplo.
      </p>

      {ordered.length > 0 ? (
        <ol aria-label="Imágenes de la propiedad" className="mt-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3">
          {ordered.map((image, index) => {
            const number = index + 1;
            return (
              <li key={image.id} className="overflow-hidden rounded-xl border border-line">
                <div className="relative aspect-[4/3] bg-line/40">
                  <Image
                    src={image.url}
                    alt={`${propertyTitle}: imagen ${number}`}
                    fill
                    sizes="(min-width: 1024px) 240px, (min-width: 420px) 50vw, 100vw"
                    className="object-cover"
                  />
                  <span
                    className={cn(
                      "absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      image.isMain ? "bg-accent text-on-accent" : "bg-surface/90 text-ink",
                    )}
                  >
                    {image.isMain ? "Principal" : number}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 p-2">
                  {!image.isMain && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => saveOrder(makeMainImage(order, image.id), "Imagen principal actualizada.")}
                      className={actionClassName}
                    >
                      Principal
                    </button>
                  )}
                  {!image.isMain && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy || index <= 1}
                        onClick={() => saveOrder(moveImage(order, image.id, -1), "Orden guardado.")}
                        aria-label={`Mover la imagen ${number} antes`}
                        title="Mover antes"
                        className={actionClassName}
                      >
                        <span aria-hidden="true">←</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy || index === ordered.length - 1}
                        onClick={() => saveOrder(moveImage(order, image.id, 1), "Orden guardado.")}
                        aria-label={`Mover la imagen ${number} después`}
                        title="Mover después"
                        className={actionClassName}
                      >
                        <span aria-hidden="true">→</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDelete(image, number)}
                    aria-label={`Eliminar la imagen ${number}`}
                    className={cn(actionClassName, "ml-auto hover:border-red-700 hover:text-red-700 dark:hover:border-red-400 dark:hover:text-red-400")}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">Sin imágenes todavía.</p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <label
          htmlFor="property-image-upload"
          className={cn(
            "inline-flex h-11 cursor-pointer items-center rounded-full bg-accent px-6 font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover focus-within:ring-2 focus-within:ring-brass/60",
            isBusy && "pointer-events-none opacity-70",
          )}
        >
          {isBusy ? "Procesando…" : "Subir imágenes"}
          <input
            ref={inputRef}
            id="property-image-upload"
            type="file"
            multiple
            accept={PROPERTY_IMAGE_TYPES.join(",")}
            onChange={handleFiles}
            disabled={isBusy}
            className="sr-only"
          />
        </label>
        <p
          role={status.tone === "error" ? "alert" : "status"}
          className={status.tone === "error" ? "basis-full text-sm text-red-700 dark:text-red-400" : "text-sm font-medium text-ink"}
        >
          {status.message}
        </p>
      </div>
    </section>
  );
}
