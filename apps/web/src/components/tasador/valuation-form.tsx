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
import { ValuationProgress } from "@/components/tasador/valuation-progress";
import { COMMUNE_NAMES } from "@/lib/communes";

const errorClassName = "mt-2 text-sm text-red-700 dark:text-red-400";
const questionClassName = "mb-3 block font-semibold text-ink";

type FieldName = "address" | "commune" | "propertyType" | "operation" | "totalArea" | "usableArea" | "bedrooms" | "bathrooms" | "parkingSpaces" | "constructionYear";
const FIELD_COUNT = 10;

type QuestionCardProps = { number: number; done: boolean; children: ReactNode; role?: "group"; labelledBy?: string };

/** One question as a card: a numbered badge that turns into an orange check once it has a valid answer. */
function QuestionCard({ number, done, children, role, labelledBy }: QuestionCardProps) {
  return (
    <div
      role={role}
      aria-labelledby={labelledBy}
      className={`relative rounded-2xl border bg-surface p-5 pl-16 transition-[border-color,box-shadow] duration-300 motion-reduce:transition-none ${
        done ? "border-accent/50 shadow-[0_12px_32px_-20px_rgb(245_105_8/0.6)]" : "border-line"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-4 top-5 grid size-9 place-items-center rounded-full text-sm font-bold transition-colors duration-300 motion-reduce:transition-none ${
          done ? "bg-accent text-on-accent" : "bg-paper text-muted ring-1 ring-line"
        }`}
      >
        {done ? (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        ) : (
          number
        )}
      </span>
      {children}
    </div>
  );
}

const propertyTypeOptions = [
  { value: "APARTMENT", label: "Departamento" },
  { value: "HOUSE", label: "Casa" },
] as const;
const operationOptions = [
  { value: "RENT", label: "Arriendo" },
  { value: "SALE", label: "Venta" },
] as const;

// Same colours as the property cards: sale is orange, rent is the brand blue.
const selectedClassName: Record<string, string> = {
  RENT: "aria-pressed:border-brand-blue aria-pressed:bg-brand-blue aria-pressed:text-white",
  SALE: "aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-on-accent",
  HOUSE: "aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-on-accent",
  APARTMENT: "aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-on-accent",
};

const optionIcons: Record<string, string> = {
  HOUSE: "M3 11.5 12 4l9 7.5M5.5 10v10h13V10M10 20v-5h4v5",
  APARTMENT: "M5 21V4h9v17M14 9h5v12M8 8h2M8 12h2M8 16h2M3 21h18",
  SALE: "M12 3v18M16.5 7.5c-.8-1.2-2.3-2-4.5-2-2.6 0-4 1.2-4 2.8 0 4.2 9 2 9 6.4 0 1.7-1.6 2.8-4.5 2.8-2.4 0-4-.9-4.8-2.2",
  RENT: "M4 9h10a4 4 0 1 1 0 8H4M4 9l3-3M4 9l3 3",
};

/** Options `min` to `max`, the last one shown as "max+". */
const countOptions = (min: number, max: number) =>
  Array.from({ length: max - min + 1 }, (_, index) => {
    const value = min + index;
    return { value, label: value === max ? `${max}+` : String(value) };
  });

const pillClassName =
  "chip-pop inline-flex h-12 items-center gap-2 rounded-full border border-line bg-paper px-5 font-medium text-muted transition-[color,border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brass hover:text-ink motion-reduce:transition-none motion-reduce:hover:translate-y-0";
const chipClassName =
  "chip-pop grid size-11 place-items-center rounded-full border border-line bg-paper text-base font-medium text-muted transition-[color,border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brass hover:text-ink aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-on-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0";
const bigInputClassName =
  "w-full min-w-0 flex-1 border-0 bg-transparent p-0 font-display text-3xl text-ink placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-0";

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
    // Year the building was finished: it weighs on the price, so it is required.
    constructionYear: "",
  });

  const parsed = valuationRequestSchema.safeParse({
    ...values,
    constructionYear: toNumber(values.constructionYear),
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

  // A year typed but out of range gets its message; an empty one just keeps «Continuar» closed.
  const yearError =
    values.constructionYear.trim() !== "" && !parsed.success
      ? parsed.error.issues.find((issue) => issue.path[0] === "constructionYear")?.message
      : undefined;

  // A field counts once it has a value the schema does not complain about.
  const hasIssue = (name: string) => !parsed.success && parsed.error.issues.some((issue) => issue.path[0] === name);
  const isDone = (name: FieldName) => values[name].trim() !== "" && !hasIssue(name);
  const doneCount = (Object.keys(values) as FieldName[]).filter(isDone).length;

  const setValue = (name: keyof typeof values, value: string) => setValues((current) => ({ ...current, [name]: value }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (parsed.success) onContinue(parsed.data);
  }

  const choiceGroup = (
    number: number,
    name: "propertyType" | "operation",
    id: string,
    question: string,
    options: readonly { value: string; label: string }[],
  ) => (
    <QuestionCard number={number} done={isDone(name)} role="group" labelledBy={id}>
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
            className={`${pillClassName} ${selectedClassName[option.value]}`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d={optionIcons[option.value]} />
            </svg>
            {option.label}
          </button>
        ))}
      </div>
    </QuestionCard>
  );

  const countGroup = (
    number: number,
    name: "bedrooms" | "bathrooms" | "parkingSpaces",
    id: string,
    question: string,
    min: number,
    max: number,
  ) => (
    <QuestionCard number={number} done={isDone(name)} role="group" labelledBy={id}>
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
    </QuestionCard>
  );

  const areaField = (number: number, name: "totalArea" | "usableArea", label: string, placeholder: string, extra?: ReactNode) => (
    <QuestionCard number={number} done={isDone(name)}>
      <label htmlFor={`valuation-${name}`} className={questionClassName}>
        {label}
      </label>
      <div className="flex items-baseline gap-2 border-b-2 border-line pb-1 transition-colors duration-200 focus-within:border-accent">
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
          className={bigInputClassName}
        />
        <span aria-hidden="true" className="font-display text-2xl italic text-brass-text">
          m²
        </span>
      </div>
      {extra}
    </QuestionCard>
  );

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-3">
      <p className="font-semibold text-ink">Para estimar el valor de la propiedad necesitamos algunos datos:</p>

      <ValuationProgress done={doneCount} total={FIELD_COUNT} />

      <QuestionCard number={1} done={isDone("address") && isDone("commune")}>
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
      </QuestionCard>

      {choiceGroup(2, "propertyType", "valuation-type-label", "¿Qué tipo de propiedad es?", propertyTypeOptions)}
      {choiceGroup(3, "operation", "valuation-operation-label", "¿Qué precio quieres conocer?", operationOptions)}
      {areaField(
        4,
        "usableArea",
        "Superficie construida en m² (estimada)",
        "Ej. 130",
        areaError && (
          <p id="valuation-area-error" role="alert" className={errorClassName}>
            {areaError}
          </p>
        ),
      )}
      {areaField(5, "totalArea", "Superficie total en m² (estimada)", "Ej. 200")}
      {countGroup(6, "bedrooms", "valuation-bedrooms-label", "Número de dormitorios", 1, VALUATION_MAX_BEDROOMS)}
      {countGroup(7, "bathrooms", "valuation-bathrooms-label", "Número de baños", 1, VALUATION_MAX_BATHROOMS)}
      {countGroup(8, "parkingSpaces", "valuation-parking-label", "Número de estacionamientos", 0, VALUATION_MAX_PARKING_SPACES)}
      <QuestionCard number={9} done={isDone("constructionYear")}>
        <label htmlFor="valuation-constructionYear" className={questionClassName}>
          Año de construcción
        </label>
        <div className="flex items-baseline gap-2 border-b-2 border-line pb-1 transition-colors duration-200 focus-within:border-accent">
        <input
          id="valuation-constructionYear"
          name="constructionYear"
          value={values.constructionYear}
          onChange={(event) => setValue("constructionYear", event.target.value)}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          placeholder={`Ej. ${new Date().getFullYear() - 15}`}
          aria-invalid={yearError ? true : undefined}
          aria-describedby={yearError ? "valuation-year-error" : "valuation-year-hint"}
          className={bigInputClassName}
        />
        </div>
        <p id="valuation-year-hint" className="mt-3 flex items-start gap-2 text-sm text-muted">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0 text-brass-text" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
          </svg>
          Es de los datos que más pesan en el precio: una propiedad más nueva vale más.
        </p>
        {yearError && (
          <p id="valuation-year-error" role="alert" className={errorClassName}>
            {yearError}
          </p>
        )}
      </QuestionCard>

      <div className="flex justify-end pt-3">
        <button
          type="submit"
          disabled={!parsed.success}
          className="cta-pulse h-12 min-w-44 rounded-full bg-accent px-8 font-semibold text-on-accent transition-[background-color,transform,opacity] duration-200 hover:-translate-y-px hover:bg-accent-hover active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-on-accent/80 disabled:shadow-none disabled:[animation:none]"
        >
          Continuar
        </button>
      </div>
    </form>
  );
}
