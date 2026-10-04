"use client";

import type { PropertyImageDetail } from "@portal/shared/property";
import { MAX_PROPERTY_IMAGE_BYTES, PROPERTY_IMAGE_TYPES } from "@portal/shared/property-image";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { ApiClientError } from "@/lib/api-client";
import { uploadPropertyImage, validatePropertyImageFile } from "@/lib/property-images";

type Status = { tone: "idle" | "uploading" | "success" | "error"; message: string };

type PropertyImagesProps = {
  propertyId: string;
  propertyTitle: string;
  images: PropertyImageDetail[];
};

/**
 * Images of a property: upload to Cloudinary through the API and the current gallery.
 * Removing, reordering and choosing the main image come in task 27.
 */
export function PropertyImages({ propertyId, propertyTitle, images }: PropertyImagesProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ tone: "idle", message: "" });
  const ordered = [...images].sort((a, b) => Number(b.isMain) - Number(a.isMain) || a.position - b.position);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const problem = await validatePropertyImageFile(file);
    if (problem) {
      setStatus({ tone: "error", message: problem });
      event.target.value = "";
      return;
    }

    setStatus({ tone: "uploading", message: "Subiendo imagen…" });
    try {
      await uploadPropertyImage(propertyId, file);
      setStatus({ tone: "success", message: "Imagen subida." });
      // The gallery is server-rendered.
      router.refresh();
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof ApiClientError ? error.message : "No pudimos subir la imagen. Inténtalo de nuevo.",
      });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isUploading = status.tone === "uploading";

  return (
    <section aria-labelledby="property-images-title" className="mt-10 rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft sm:p-8">
      <h2 id="property-images-title" className="font-display text-3xl font-semibold tracking-tight text-ink">
        Imágenes
      </h2>
      <p className="mt-1 text-muted">
        JPG, PNG o WebP de hasta {MAX_PROPERTY_IMAGE_BYTES / (1024 * 1024)} MB. La primera imagen propia queda como principal y reemplaza a las de ejemplo.
      </p>

      {ordered.length > 0 ? (
        <ul aria-label="Imágenes de la propiedad" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ordered.map((image, index) => (
            <li key={image.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-line/40">
              <Image
                src={image.url}
                alt={`${propertyTitle}: imagen ${index + 1}`}
                fill
                sizes="(min-width: 640px) 240px, 50vw"
                className="object-cover"
              />
              {image.isMain && (
                <span className="absolute left-2 top-2 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-on-accent">
                  Principal
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">Sin imágenes todavía.</p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <label
          htmlFor="property-image-upload"
          className={`inline-flex h-11 cursor-pointer items-center rounded-full bg-accent px-6 font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover focus-within:ring-2 focus-within:ring-brass/60 ${isUploading ? "pointer-events-none opacity-70" : ""}`}
        >
          {isUploading ? "Subiendo…" : "Subir imagen"}
          <input
            ref={inputRef}
            id="property-image-upload"
            type="file"
            accept={PROPERTY_IMAGE_TYPES.join(",")}
            onChange={handleChange}
            disabled={isUploading}
            className="sr-only"
          />
        </label>
        <p
          role={status.tone === "error" ? "alert" : "status"}
          className={status.tone === "error" ? "text-sm text-red-700 dark:text-red-400" : "text-sm font-medium text-ink"}
        >
          {status.message}
        </p>
      </div>
    </section>
  );
}
