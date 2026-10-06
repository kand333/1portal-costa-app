"use client";

import {
  FEATURE_NAME_MAX_LENGTH,
  MAX_FEATURES_PER_PROPERTY,
  PROPERTY_DESCRIPTION_MAX_LENGTH,
  PROPERTY_LOCATION_MAX_LENGTH,
  PROPERTY_TITLE_MAX_LENGTH,
  type AdminPropertyDetail,
} from "@portal/shared/admin-property";
import { OPERATION_TYPES, PROPERTY_TYPES } from "@portal/shared/enums";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { ADMIN_PROPERTIES_PATH } from "@/lib/admin-properties";
import { ApiClientError, sendJson } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { flash } from "@/lib/flash";
import { operationLabels, propertyTypeLabels } from "@/lib/property-format";
import {
  buildFeatureOptions,
  hasFeature,
  toggleFeature,
  toPropertyFormValues,
  validatePropertyForm,
  type PropertyFormErrors,
  type PropertyFormField,
  type PropertyFormValues,
} from "@/lib/property-form";

type Status = "idle" | "saving" | "error";

const fieldId = (name: PropertyFormField) => `property-${name}`;

const controlClassName =
  "w-full rounded-xl border border-line bg-surface px-3.5 text-ink transition-colors duration-200 hover:border-brass/60 focus-visible:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40 aria-invalid:border-red-600";

function FieldError({ name, error }: { name: PropertyFormField; error: string | undefined }) {
  if (!error) return null;
  return (
    <p id={`${fieldId(name)}-error`} className="mt-1 text-sm text-red-700 dark:text-red-400">
      {error}
    </p>
  );
}

function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft sm:p-8">
      <legend className="sr-only">{title}</legend>
      <h2 aria-hidden="true" className="font-display text-3xl font-semibold tracking-tight text-ink">
        {title}
      </h2>
      {description && <p className="mt-1 text-muted">{description}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

type SelectFieldProps = {
  name: "operationType" | "propertyType";
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  error: string | undefined;
  onChange: (value: string) => void;
};

function SelectField({ name, label, value, options, error, onChange }: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={fieldId(name)} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={fieldId(name)}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId(name)}-error` : undefined}
        className={cn(controlClassName, "h-11")}
      >
        <option value="">Elige una opción</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError name={name} error={error} />
    </div>
  );
}

type CheckboxFieldProps = {
  name: "isPublished" | "isFeatured";
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function CheckboxField({ name, label, hint, checked, onChange }: CheckboxFieldProps) {
  return (
    <div className="flex items-start gap-3 sm:col-span-2">
      <input
        id={fieldId(name)}
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-describedby={`${fieldId(name)}-hint`}
        className="mt-1 size-4 cursor-pointer accent-accent"
      />
      <div>
        <label htmlFor={fieldId(name)} className="block cursor-pointer font-medium text-ink">
          {label}
        </label>
        <p id={`${fieldId(name)}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      </div>
    </div>
  );
}

const operationOptions = OPERATION_TYPES.map((value) => ({ value, label: operationLabels[value] }));
const propertyTypeOptions = PROPERTY_TYPES.map((value) => ({ value, label: propertyTypeLabels[value] }));

type PropertyFormProps = {
  /** null: creates a new property. */
  property: AdminPropertyDetail | null;
  /** Feature catalog (names): offered as checkboxes after the common ones. */
  catalog?: string[];
};

/** ADMIN form to create or edit a property. No coordinates: the map is built from the address. */
export function PropertyForm({ property, catalog = [] }: PropertyFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(() => toPropertyFormValues(property));
  const [errors, setErrors] = useState<PropertyFormErrors>({});
  const [newFeature, setNewFeature] = useState("");
  // Features outside the common list (stored or added here) keep their checkbox once unchecked.
  const [otherFeatures, setOtherFeatures] = useState<string[]>(() => property?.features ?? []);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function setValue<Field extends PropertyFormField>(name: Field, value: PropertyFormValues[Field]) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    if (status !== "saving") setStatus("idle");
  }

  /** Props shared by the text and number inputs. */
  const inputProps = (name: PropertyFormField, label: string) => ({
    id: fieldId(name),
    name,
    label,
    value: String(values[name]),
    onChange: (event: { target: { value: string } }) => setValue(name, event.target.value),
    error: errors[name],
  });
  const numberProps = (name: PropertyFormField, label: string, step: string) => ({
    ...inputProps(name, label),
    type: "number",
    inputMode: step === "1" ? ("numeric" as const) : ("decimal" as const),
    min: 0,
    step,
  });

  const featureOptions = buildFeatureOptions([...catalog, ...otherFeatures, ...values.features]);
  const isFeatureLimitReached = values.features.length >= MAX_FEATURES_PER_PROPERTY;

  /** Adds a feature that is not in the list, already checked (or checks it if it is). */
  function handleAddFeature() {
    if (isFeatureLimitReached || !newFeature.trim()) return;
    setOtherFeatures((previous) => [...previous, newFeature.trim()]);
    setValue("features", toggleFeature(values.features, newFeature, true));
    setNewFeature("");
  }

  function handleFeatureKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Enter adds the feature instead of submitting the whole form.
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleAddFeature();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "saving") return;

    const result = validatePropertyForm(values);
    if (!result.success) {
      setErrors(result.errors);
      const firstInvalid = (Object.keys(values) as PropertyFormField[]).find((name) => result.errors[name]);
      if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }

    setStatus("saving");
    try {
      if (property) {
        const updated = await sendJson<AdminPropertyDetail>("PUT", `/api/admin/properties/${property.id}`, result.data);
        setValues(toPropertyFormValues(updated));
        setStatus("idle");
        flash(`Cambios guardados en «${updated.title}».`);
        // Re-renders the server header (title, publication state).
        router.refresh();
      } else {
        const created = await sendJson<AdminPropertyDetail>("POST", "/api/admin/properties", result.data);
        flash(`Propiedad «${created.title}» creada${created.isPublished ? " y publicada" : " sin publicar"}. Ya puedes agregar imágenes.`);
        router.push(`${ADMIN_PROPERTIES_PATH}/${created.id}/edit`);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError ? error.message : "No pudimos conectar con el servidor. Inténtalo de nuevo.",
      );
      setStatus("error");
    }
  }

  const isSaving = status === "saving";

  return (
    <form noValidate onSubmit={handleSubmit} aria-label="Formulario de la propiedad" className="mt-10 space-y-8">
      <FormSection title="Información general">
        <div className="sm:col-span-2">
          <AuthFormField {...inputProps("title", "Título")} type="text" maxLength={PROPERTY_TITLE_MAX_LENGTH} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={fieldId("description")} className="mb-1.5 block text-sm font-medium text-ink">
            Descripción
          </label>
          <textarea
            id={fieldId("description")}
            name="description"
            rows={6}
            maxLength={PROPERTY_DESCRIPTION_MAX_LENGTH}
            value={values.description}
            onChange={(event) => setValue("description", event.target.value)}
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={errors.description ? `${fieldId("description")}-error` : undefined}
            className={cn(controlClassName, "py-2.5")}
          />
          <FieldError name="description" error={errors.description} />
        </div>
        <SelectField
          name="operationType"
          label="Operación"
          value={values.operationType}
          options={operationOptions}
          error={errors.operationType}
          onChange={(value) => setValue("operationType", value as PropertyFormValues["operationType"])}
        />
        <SelectField
          name="propertyType"
          label="Tipo"
          value={values.propertyType}
          options={propertyTypeOptions}
          error={errors.propertyType}
          onChange={(value) => setValue("propertyType", value as PropertyFormValues["propertyType"])}
        />
      </FormSection>

      <FormSection title="Precio y superficie" description="Precio en dólares (USD). En arriendo, el valor mensual.">
        <div className="sm:col-span-2">
          <AuthFormField {...numberProps("price", "Precio (USD)", "0.01")} />
        </div>
        <AuthFormField {...numberProps("usableArea", "Superficie útil (m², opcional)", "0.01")} />
        <AuthFormField {...numberProps("totalArea", "Superficie total (m², opcional)", "0.01")} />
      </FormSection>

      <FormSection title="Distribución" description="Deja en blanco lo que no aplique (por ejemplo, en un terreno).">
        <AuthFormField {...numberProps("bedrooms", "Dormitorios", "1")} />
        <AuthFormField {...numberProps("bathrooms", "Baños", "1")} />
        <AuthFormField {...numberProps("parkingSpaces", "Estacionamientos", "1")} />
        <AuthFormField {...numberProps("ageInYears", "Antigüedad (años; 0 si es nueva)", "1")} />
      </FormSection>

      <FormSection title="Ubicación" description="El mapa se ubica a partir de la dirección: no necesitas coordenadas.">
        <div className="sm:col-span-2">
          <AuthFormField {...inputProps("address", "Dirección")} type="text" maxLength={PROPERTY_LOCATION_MAX_LENGTH} />
        </div>
        <AuthFormField {...inputProps("commune", "Comuna")} type="text" maxLength={PROPERTY_LOCATION_MAX_LENGTH} />
        <AuthFormField {...inputProps("city", "Ciudad")} type="text" maxLength={PROPERTY_LOCATION_MAX_LENGTH} />
        <div className="sm:col-span-2">
          <AuthFormField {...inputProps("region", "Región")} type="text" maxLength={PROPERTY_LOCATION_MAX_LENGTH} />
        </div>
      </FormSection>

      <FormSection
        title="Características"
        description={`Marca las que tiene la propiedad (${values.features.length} de ${MAX_FEATURES_PER_PROPERTY}).`}
      >
        <div className="sm:col-span-2">
          <ul aria-label="Características" className="grid grid-cols-1 gap-x-4 gap-y-1 min-[420px]:grid-cols-2 md:grid-cols-3">
            {featureOptions.map((feature, index) => {
              const isChecked = hasFeature(values.features, feature);
              const id = `property-feature-${index}`;
              return (
                <li key={feature}>
                  <label
                    htmlFor={id}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-ink transition-colors duration-200 hover:bg-paper",
                      !isChecked && isFeatureLimitReached && "cursor-not-allowed opacity-50 hover:bg-transparent",
                    )}
                  >
                    <input
                      id={id}
                      type="checkbox"
                      checked={isChecked}
                      // At the limit only unchecking is possible.
                      disabled={!isChecked && isFeatureLimitReached}
                      onChange={(event) => setValue("features", toggleFeature(values.features, feature, event.target.checked))}
                      className="size-4 shrink-0 cursor-pointer accent-accent disabled:cursor-not-allowed"
                    />
                    <span className="min-w-0 break-words">{feature}</span>
                  </label>
                </li>
              );
            })}
          </ul>

          <label htmlFor={fieldId("features")} className="mb-1.5 mt-5 block text-sm font-medium text-ink">
            Otra característica
          </label>
          <div className="flex gap-2">
            <input
              id={fieldId("features")}
              type="text"
              value={newFeature}
              maxLength={FEATURE_NAME_MAX_LENGTH}
              disabled={isFeatureLimitReached}
              placeholder={isFeatureLimitReached ? `Máximo ${MAX_FEATURES_PER_PROPERTY} características` : "Por ejemplo: vista al mar"}
              onChange={(event) => setNewFeature(event.target.value)}
              onKeyDown={handleFeatureKeyDown}
              aria-invalid={errors.features ? true : undefined}
              aria-describedby={errors.features ? `${fieldId("features")}-error` : undefined}
              className={cn(controlClassName, "h-11 min-w-0 flex-1 disabled:cursor-not-allowed disabled:opacity-60")}
            />
            <button
              type="button"
              onClick={handleAddFeature}
              disabled={isFeatureLimitReached}
              className="h-11 shrink-0 rounded-full border border-line px-5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-brass hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
            >
              Agregar
            </button>
          </div>
          <FieldError name="features" error={errors.features} />
        </div>
      </FormSection>

      <FormSection title="Publicación">
        <CheckboxField
          name="isPublished"
          label="Publicada"
          hint="Visible en el catálogo y en su página pública."
          checked={values.isPublished}
          onChange={(checked) => setValue("isPublished", checked)}
        />
        <CheckboxField
          name="isFeatured"
          label="Destacada"
          hint="Aparece en la portada (solo si está publicada)."
          checked={values.isFeatured}
          onChange={(checked) => setValue("isFeatured", checked)}
        />
      </FormSection>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={isSaving}
          className="h-12 rounded-full bg-accent px-7 font-semibold text-on-accent transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-accent-hover active:translate-y-0 disabled:translate-y-0 disabled:opacity-70"
        >
          {isSaving ? "Guardando…" : property ? "Guardar cambios" : "Crear propiedad"}
        </button>
        <Link
          href={ADMIN_PROPERTIES_PATH}
          className="text-sm font-semibold text-ink underline decoration-brass decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
        >
          Cancelar
        </Link>
        {status === "error" && (
          <p role="alert" className="basis-full text-sm text-red-700 dark:text-red-400">
            {errorMessage}
          </p>
        )}
      </div>
    </form>
  );
}
