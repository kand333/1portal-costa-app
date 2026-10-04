import type { AdminPropertyDetail } from "@portal/shared/admin-property";
import Link from "next/link";
import { ADMIN_PROPERTIES_PATH } from "@/lib/admin-properties";
import { formatLocation } from "@/lib/property-format";
import { PropertyForm } from "./property-form";
import { PropertyImages } from "./property-images";

type AdminPropertyEditorProps = {
  /** null: a new property. */
  property: AdminPropertyDetail | null;
  /** Feature catalog (names) for the form's checkboxes. */
  catalog?: string[];
  /** The property was just created (the form redirects here after creating it). */
  isNew?: boolean;
};

/** Page to create or edit a property. */
export function AdminPropertyEditor({ property, catalog = [], isNew = false }: AdminPropertyEditorProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 sm:px-6">
      <Link
        href={ADMIN_PROPERTIES_PATH}
        className="inline-flex text-sm font-semibold text-muted underline decoration-brass decoration-1 underline-offset-4 transition-colors duration-200 hover:text-ink"
      >
        Volver a propiedades
      </Link>
      <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight text-ink">
        {property ? "Editar propiedad" : "Nueva propiedad"}
      </h1>
      {property ? (
        <div className="mt-3 space-y-1 text-lg text-muted">
          <p className="text-ink">{property.title}</p>
          <p>
            {formatLocation(property.commune, property.city)} · {property.isPublished ? "Publicada" : "Sin publicar"}
            {property.isPublished && (
              <>
                {" · "}
                <Link
                  href={`/properties/${property.id}`}
                  className="font-semibold text-ink underline decoration-brass decoration-1 underline-offset-4 hover:decoration-ink"
                >
                  Ver en el portal
                </Link>
              </>
            )}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-lg text-muted">Se guardará sin publicar hasta que la marques como publicada.</p>
      )}

      {isNew && (
        <p role="status" className="mt-6 rounded-[1.25rem] border border-accent/40 bg-accent/10 px-5 py-3 text-sm font-medium text-ink">
          Propiedad creada{property?.isPublished ? " y publicada" : " sin publicar"}.
        </p>
      )}

      {/* Keyed by property: moving to another property's edit page reuses the route, so the form must start over. */}
      <PropertyForm key={property?.id ?? "new"} property={property} catalog={catalog} />

      {property ? (
        <PropertyImages propertyId={property.id} propertyTitle={property.title} images={property.images} />
      ) : (
        <p className="mt-10 text-sm text-muted">Podrás subir imágenes después de crear la propiedad.</p>
      )}
    </div>
  );
}
