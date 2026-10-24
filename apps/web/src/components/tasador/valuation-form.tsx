"use client";

import { LEAD_ADDRESS_MAX_LENGTH } from "@portal/shared/lead";
import {
  VALUATION_MAX_BATHROOMS,
  VALUATION_MAX_BEDROOMS,
  VALUATION_MAX_PARKING_SPACES,
  valuationRequestSchema,
  type ValuationRequest,
} from "@portal/shared/valuation";
import { useState, type FormEvent, type ReactNode } from "react";
import { COMMUNE_NAMES } from "@/lib/communes";

const errorClassName = "mt-2 text-sm text-red-700 dark:text-red-400";
const sectionClassName = "border-b border-line py-5";
const questionClassName = "mb-3 block font-semibold text-ink";

const propertyTypeOptions = [
  { value: "APARTMENT", label: "Departamento" },
  { value: "HOUSE", label: "Casa" },
] as const;
const operationOptions = [
  { value: "RENT", label: "Arriendo" },
  { value: "SALE", label: "Venta" },
] as const;

/** Options `min` to `max`, the last one shown as "max+". */
const countOptions = (min: number, max: number) =>
  Array.from({ length: max - min + 1 }, (_, index) => {
    const value = min + index;
    return { value, label: value === max ? `${max}+` : String(value) };
  });

const pillClassName =
  "rounded-full border border-line px-4 py-1.5 text-muted transition-colors duration-200 hover:border-brass hover:text-ink aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-on-accent";
const chipClassName =
  "grid size-9 place-items-center rounded-full border border-line text-sm text-muted transition-colors duration-200 hover:border-brass hover:text-ink aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-on-accent";

/** Empty text is `undefined` so the schema reports the field as missing. */
const toNumber = (text: string) => {
  const value = Number(text.trim().replace(",", "."));
  return text.trim() === "" || Number.isNaN(value) ? undefined : value;
};

type ValuationFormProps = {
  /** The data is complete: the page moves on to the amenities. */
  onContinue: (request: ValuationRequest) => void;
  /** Called when the commune changes or the address field loses focus, so the map can follow. */
  onLocationChange: (parts: { address: string; commune: string }) => void;
};

/** Single-step form: pill choices, numbered chips and a «Continuar» button that opens once the data is valid. */
export function ValuationForm({ onContinue, onLocationChange }: ValuationFormProps) {
  const [values, setValues] = useState({
    address: "",
    commune: "",
    propertyType: "",
    operation: "",
    totalArea: "",
    usableArea: "",
    bedrooms: "",
    bathrooms: "",
    parkingSpaces: "",
  });

  const parsed = valuationRequestSchema.safeParse({
    ...values,
    totalArea: toNumber(values.totalArea),
    usableArea: toNumber(values.usableArea),
    bedrooms: toNumber(values.bedrooms),
    bathrooms: toNumber(values.bathrooms),
    parkingSpaces: toNumber(values.parkingSpaces),
  });
  // The only rule the person can break with every field filled in.
  const areaError =
    values.totalArea && values.usableArea && !parsed.success
      ? parsed.error.issues.find((issue) => issue.path[0] === "usableArea" && issue.message.includes("superar"))?.message
      : undefined;

  const setValue = (name: keyof typeof values, value: string) => setValues((current) => ({ ...current, [name]: value }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (parsed.success) onContinue(parsed.data);
  }

  const choiceGroup = (
    name: "propertyType" | "operation",
    id: string,
    question: string,
    options: readonly { value: string; label: string }[],
  ) => (
    <div role="group" aria-labelledby={id} className={sectionClassName}>
      <span id={id} className={questionClassName}>
        {question}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={values[name] === option.value}
            onClick={() => setValue(name, option.value)}
            className={pillClassName}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  const countGroup = (
    name: "bedrooms" | "bathrooms" | "parkingSpaces",
    id: string,
    question: string,
    min: number,
    max: number,
  ) => (
    <div role="group" aria-labelledby={id} className={sectionClassName}>
      <span id={id} className={questionClassName}>
        {question}
      </span>
      <div className="flex flex-wrap gap-2">
        {countOptions(min, max).map((option) => (
          <button
            key={option.value}
            type="button"
            aria-label={`${question}: ${option.label}`}
            aria-pressed={values[name] === String(option.value)}
            onClick={() => setValue(name, String(option.value))}
            className={chipClassName}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  const areaField = (name: "totalArea" | "usableArea", label: string, placeholder: string, extra?: ReactNode) => (
    <div className={sectionClassName}>
      <label htmlFor={`valuation-${name}`} className={questionClassName}>
        {label}
      </label>
      <input
        id={`valuation-${name}`}
        value={values[name]}
        onChange={(event) => setValue(name, event.target.value)}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        aria-invalid={name === "usableArea" && areaError ? true : undefined}
        aria-describedby={name === "usableArea" && areaError ? "valuation-area-error" : undefined}
        className="w-full border-0 bg-transparent p-0 text-xl text-ink placeholder:text-muted/60 focus-visible:outline-none focus-visible:ring-0"
      />
      {extra}
    </div>
  );

  return (
    <form noValidate onSubmit={handleSubmit}>
      <p className="font-semibold text-ink">Para estimar el valor de la propiedad necesitamos algunos datos:</p>

      <div className="pb-5 pt-5">
        <label htmlFor="valuation-address" className={questionClassName}>
          Dirección de la propiedad
        </label>
        <div className="flex h-11 items-center gap-2 rounded-md bg-paper px-3 ring-1 ring-line focus-within:ring-2 focus-within:ring-brass/60">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <input
            id="valuation-address"
            value={values.address}
            onChange={(event) => setValue("address", event.target.value)}
            onBlur={() => onLocationChange({ address: values.address, commune: values.commune })}
            type="text"
            autoComplete="street-address"
            maxLength={LEAD_ADDRESS_MAX_LENGTH}
            placeholder="Ej. Barros Arana 1000"
            className="h-full min-w-0 flex-1 border-0 bg-transparent text-ink placeholder:text-muted focus-visible:outline-none"
          />
        </div>
        <label htmlFor="valuation-commune" className="mb-2 mt-4 block font-semibold text-ink">
          Comuna
        </label>
        <select
          id="valuation-commune"
          value={values.commune}
          onChange={(event) => {
            setValue("commune", event.target.value);
            onLocationChange({ address: values.address, commune: event.target.value });
          }}
          className="h-11 w-full rounded-md bg-paper px-3 text-ink ring-1 ring-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/60"
        >
          <option value="">Selecciona una comuna</option>
          {COMMUNE_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {choiceGroup("propertyType", "valuation-type-label", "¿Qué tipo de propiedad es?", propertyTypeOptions)}
      {choiceGroup("operation", "valuation-operation-label", "¿Qué precio quieres conocer?", operationOptions)}
      {areaField("totalArea", "Superficie total en m² (estimada)", "Ej. 200")}
      {areaField(
        "usableArea",
        "Superficie construida en m² (estimada)",
        "Ej. 130",
        areaError && (
          <p id="valuation-area-error" role="alert" className={errorClassName}>
            {areaError}
          </p>
        ),
      )}
      {countGroup("bedrooms", "valuation-bedrooms-label", "Número de dormitorios", 1, VALUATION_MAX_BEDROOMS)}
      {countGroup("bathrooms", "valuation-bathrooms-label", "Número de baños", 1, VALUATION_MAX_BATHROOMS)}
      {countGroup("parkingSpaces", "valuation-parking-label", "Número de estacionamientos", 0, VALUATION_MAX_PARKING_SPACES)}

      <div className="flex justify-end pt-5">
        <button
          type="submit"
          disabled={!parsed.success}
          className="h-12 min-w-44 rounded-full bg-accent px-8 font-semibold text-on-accent transition-[background-color,transform,opacity] duration-200 hover:-translate-y-px hover:bg-accent-hover active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-on-accent/80"
        >
          Continuar
        </button>
      </div>
    </form>
  );
}
