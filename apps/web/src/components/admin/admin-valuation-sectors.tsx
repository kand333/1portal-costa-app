"use client";

import {
  VALUATION_COEFFICIENT_MAX,
  VALUATION_COEFFICIENT_MIN,
  VALUATION_SECTOR_SOURCES,
  valuationCityBaseSchema,
  valuationCityCreateSchema,
  valuationSectorCreateSchema,
  type ValuationCityDto,
  type ValuationSectorDto,
  type ValuationSectorSource,
} from "@portal/shared/valuation-sector";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  createValuationCity,
  createValuationSector,
  sectorUfPerSquareMeter,
  updateValuationCityBase,
  updateValuationSector,
} from "@/lib/admin-valuation-sectors";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { flash } from "@/lib/flash";

type Status = { tone: "idle" | "busy" | "error"; message: string };

const inputClassName =
  "h-10 w-full min-w-0 rounded-xl border border-line bg-surface px-3 text-ink transition-colors duration-200 hover:border-brass/60 focus-visible:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40";
const primaryButtonClassName =
  "inline-flex h-10 shrink-0 items-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClassName =
  "inline-flex h-10 shrink-0 items-center rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:border-brass hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40";

const errorMessageOf = (error: unknown) =>
  error instanceof ApiClientError ? error.message : "No pudimos guardar el cambio. Inténtalo de nuevo.";

/** Empty text is `undefined` so the schema reports the field as missing. */
const toNumber = (text: string) => {
  const value = Number(text.trim().replace(",", "."));
  return text.trim() === "" || Number.isNaN(value) ? undefined : value;
};

const formatUf = (value: number) => new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(value);

type Run = (action: () => Promise<unknown>, doneMessage: string, onDone?: () => void) => Promise<void>;

function CityBase({ city, run, isBusy }: { city: ValuationCityDto; run: Run; isBusy: boolean }) {
  const [values, setValues] = useState({
    houseUfPerM2: String(city.houseUfPerM2),
    apartmentUfPerM2: String(city.apartmentUfPerM2),
    landUfPerM2: String(city.landUfPerM2),
  });
  const parsed = valuationCityBaseSchema.safeParse({
    houseUfPerM2: toNumber(values.houseUfPerM2),
    apartmentUfPerM2: toNumber(values.apartmentUfPerM2),
    landUfPerM2: toNumber(values.landUfPerM2),
  });
  const fields = [
    ["apartmentUfPerM2", "Departamento"],
    ["houseUfPerM2", "Casa"],
    ["landUfPerM2", "Terreno"],
  ] as const;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (parsed.success) void run(() => updateValuationCityBase(city.id, parsed.data), `Precios base de ${city.name} guardados.`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={`Precios base de ${city.name}`} className="mt-4 flex flex-wrap items-end gap-3">
      {fields.map(([name, label]) => (
        <div key={name} className="w-32">
          <label htmlFor={`${city.id}-${name}`} className="mb-1 block text-xs font-medium text-muted">
            {label} (UF/m²)
          </label>
          <input
            id={`${city.id}-${name}`}
            value={values[name]}
            inputMode="decimal"
            autoComplete="off"
            onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
            className={cn(inputClassName, "tabular-nums")}
          />
        </div>
      ))}
      <button type="submit" disabled={isBusy || !parsed.success} className={secondaryButtonClassName}>
        Guardar precios base
      </button>
    </form>
  );
}

function SectorRow({ sector, city, run, isBusy }: { sector: ValuationSectorDto; city: ValuationCityDto; run: Run; isBusy: boolean }) {
  const [coefficient, setCoefficient] = useState(String(sector.coefficient));
  const [source, setSource] = useState<ValuationSectorSource>(sector.source);
  const [note, setNote] = useState(sector.note);
  const value = toNumber(coefficient);
  const isValid = value !== undefined && value >= VALUATION_COEFFICIENT_MIN && value <= VALUATION_COEFFICIENT_MAX;
  const isChanged = value !== sector.coefficient || source !== sector.source || note !== sector.note;

  return (
    <tr className="align-top">
      <th scope="row" className="whitespace-nowrap py-3 pr-3 text-left font-semibold text-ink">
        {sector.name}
        <span className="block text-xs font-normal text-muted">{sector.commune}</span>
      </th>
      <td className="py-3 pr-3">
        <label htmlFor={`${sector.id}-coefficient`} className="sr-only">
          Coeficiente de {sector.name}
        </label>
        <input
          id={`${sector.id}-coefficient`}
          value={coefficient}
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={!isValid || undefined}
          onChange={(event) => setCoefficient(event.target.value)}
          className={cn(inputClassName, "w-20 tabular-nums")}
        />
      </td>
      <td className="whitespace-nowrap py-3 pr-3 tabular-nums text-brass-text">
        {isValid ? (
          <>
            <span className="block">Depto {formatUf(sectorUfPerSquareMeter(city.apartmentUfPerM2, value))}</span>
            <span className="block text-muted">Casa {formatUf(sectorUfPerSquareMeter(city.houseUfPerM2, value))}</span>
            <span className="block text-muted">Terreno {formatUf(sectorUfPerSquareMeter(city.landUfPerM2, value))}</span>
          </>
        ) : (
          <span className="text-sm text-red-700 dark:text-red-400">
            Entre {VALUATION_COEFFICIENT_MIN} y {VALUATION_COEFFICIENT_MAX}
          </span>
        )}
      </td>
      <td className="py-3 pr-3">
        <label htmlFor={`${sector.id}-source`} className="sr-only">
          Fuente de {sector.name}
        </label>
        <select
          id={`${sector.id}-source`}
          value={source}
          onChange={(event) => setSource(event.target.value as ValuationSectorSource)}
          className={cn(inputClassName, "w-32")}
        >
          {VALUATION_SECTOR_SOURCES.map((option) => (
            <option key={option} value={option}>
              {option === "estimado" ? "Estimado" : "Muestreo"}
            </option>
          ))}
        </select>
      </td>
      <td className="py-3 pr-3">
        <label htmlFor={`${sector.id}-note`} className="sr-only">
          Nota de {sector.name}
        </label>
        <input
          id={`${sector.id}-note`}
          value={note}
          maxLength={300}
          autoComplete="off"
          onChange={(event) => setNote(event.target.value)}
          className={cn(inputClassName, "min-w-48")}
        />
      </td>
      <td className="py-3">
        <button
          type="button"
          disabled={isBusy || !isValid || !isChanged}
          onClick={() => {
            if (value !== undefined)
              void run(() => updateValuationSector(sector.id, { coefficient: value, source, note }), `Sector «${sector.name}» guardado.`);
          }}
          className={secondaryButtonClassName}
        >
          Guardar
          <span className="sr-only"> {sector.name}</span>
        </button>
      </td>
    </tr>
  );
}

function AddSectorForm({ city, run, isBusy }: { city: ValuationCityDto; run: Run; isBusy: boolean }) {
  const empty = { name: "", commune: city.name, latitude: "", longitude: "", coefficient: "1" };
  const [values, setValues] = useState(empty);
  const parsed = valuationSectorCreateSchema.safeParse({
    cityId: city.id,
    name: values.name,
    commune: values.commune,
    latitude: toNumber(values.latitude),
    longitude: toNumber(values.longitude),
    coefficient: toNumber(values.coefficient),
    source: "estimado",
  });
  const fields = [
    ["name", "Nombre del sector", "w-48"],
    ["commune", "Comuna", "w-40"],
    ["latitude", "Latitud", "w-28"],
    ["longitude", "Longitud", "w-28"],
    ["coefficient", "Coeficiente", "w-24"],
  ] as const;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (parsed.success) void run(() => createValuationSector(parsed.data), `Sector «${parsed.data.name}» agregado.`, () => setValues(empty));
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={`Agregar sector a ${city.name}`} className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-5">
      {fields.map(([name, label, width]) => (
        <div key={name} className={width}>
          <label htmlFor={`${city.id}-new-${name}`} className="mb-1 block text-xs font-medium text-muted">
            {label}
          </label>
          <input
            id={`${city.id}-new-${name}`}
            value={values[name]}
            autoComplete="off"
            inputMode={name === "name" || name === "commune" ? "text" : "decimal"}
            onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
            className={inputClassName}
          />
        </div>
      ))}
      <button type="submit" disabled={isBusy || !parsed.success} className={primaryButtonClassName}>
        Agregar sector
      </button>
    </form>
  );
}

/**
 * ADMIN «Tasación por sector»: the reference table the price estimator falls back on when the portal has few
 * comparables. Each city has a base price in UF per square meter by type; each sector multiplies it by a
 * coefficient. Edit as often as needed: the estimator uses the new values right away.
 */
export function AdminValuationSectors({ cities }: { cities: ValuationCityDto[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ tone: "idle", message: "" });
  const [newCity, setNewCity] = useState({ name: "", houseUfPerM2: "", apartmentUfPerM2: "", landUfPerM2: "" });
  const isBusy = status.tone === "busy";

  const run: Run = async (action, doneMessage, onDone) => {
    setStatus({ tone: "busy", message: "Guardando…" });
    try {
      await action();
      onDone?.();
      setStatus({ tone: "idle", message: "" });
      flash(doneMessage);
      router.refresh();
    } catch (error) {
      setStatus({ tone: "error", message: errorMessageOf(error) });
    }
  };

  const parsedCity = valuationCityCreateSchema.safeParse({
    name: newCity.name,
    houseUfPerM2: toNumber(newCity.houseUfPerM2),
    apartmentUfPerM2: toNumber(newCity.apartmentUfPerM2),
    landUfPerM2: toNumber(newCity.landUfPerM2),
  });

  function handleAddCity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (parsedCity.success)
      void run(() => createValuationCity(parsedCity.data), `Ciudad «${parsedCity.data.name}» agregada.`, () =>
        setNewCity({ name: "", houseUfPerM2: "", apartmentUfPerM2: "", landUfPerM2: "" }),
      );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">Tasación por sector</h1>
      <p className="mt-2 max-w-3xl text-lg text-muted">
        Precios de referencia que usa el tasador cuando hay pocas propiedades publicadas para comparar. Cada ciudad tiene un precio base en UF por m²
        (departamento, casa y terreno) y cada sector lo multiplica por su coeficiente. Los cambios se aplican de inmediato.
      </p>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Cuántos sectores crear: ciudades de más de 300 mil habitantes, 12 a 15; de 100 a 300 mil, 6 a 8; de 30 a 100 mil, 3 a 4; menores, 1 o 2.
      </p>

      <p
        role={status.tone === "error" ? "alert" : "status"}
        className={cn("mt-4 min-h-5 text-sm", status.tone === "error" ? "text-red-700 dark:text-red-400" : "font-medium text-ink")}
      >
        {status.message}
      </p>

      <div className="mt-2 space-y-8">
        {cities.map((city) => (
          <section key={city.id} aria-labelledby={`${city.id}-title`} className="rounded-[1.25rem] border border-line bg-surface p-5 shadow-soft sm:p-6">
            <h2 id={`${city.id}-title`} className="font-display text-3xl font-semibold text-ink">
              {city.name}
            </h2>
            <CityBase city={city} run={run} isBusy={isBusy} />

            {city.sectors.length === 0 ? (
              <p className="mt-5 text-sm text-muted">Sin sectores: se usa el precio base de la ciudad para toda la comuna. Agrega sectores abajo.</p>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[44rem] text-sm">
                  <caption className="sr-only">Sectores de {city.name}</caption>
                  <thead>
                    <tr className="text-left text-xs font-medium text-muted">
                      <th scope="col" className="pb-2 pr-3 font-medium">Sector</th>
                      <th scope="col" className="pb-2 pr-3 font-medium">Coeficiente</th>
                      <th scope="col" className="pb-2 pr-3 font-medium">UF/m² resultante</th>
                      <th scope="col" className="pb-2 pr-3 font-medium">Fuente</th>
                      <th scope="col" className="pb-2 pr-3 font-medium">Nota</th>
                      <th scope="col" className="pb-2 font-medium">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {city.sectors.map((sector) => (
                      <SectorRow key={`${sector.id}-${sector.updatedAt}`} sector={sector} city={city} run={run} isBusy={isBusy} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <AddSectorForm city={city} run={run} isBusy={isBusy} />
          </section>
        ))}
      </div>

      <form onSubmit={handleAddCity} noValidate aria-label="Agregar ciudad" className="mt-10 rounded-[1.25rem] border border-dashed border-line p-5 sm:p-6">
        <h2 className="font-display text-2xl font-semibold text-ink">Agregar ciudad</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          {(
            [
              ["name", "Ciudad", "w-48"],
              ["apartmentUfPerM2", "Departamento (UF/m²)", "w-40"],
              ["houseUfPerM2", "Casa (UF/m²)", "w-36"],
              ["landUfPerM2", "Terreno (UF/m²)", "w-36"],
            ] as const
          ).map(([name, label, width]) => (
            <div key={name} className={width}>
              <label htmlFor={`new-city-${name}`} className="mb-1 block text-xs font-medium text-muted">
                {label}
              </label>
              <input
                id={`new-city-${name}`}
                value={newCity[name]}
                autoComplete="off"
                inputMode={name === "name" ? "text" : "decimal"}
                onChange={(event) => setNewCity((current) => ({ ...current, [name]: event.target.value }))}
                className={inputClassName}
              />
            </div>
          ))}
          <button type="submit" disabled={isBusy || !parsedCity.success} className={primaryButtonClassName}>
            Agregar ciudad
          </button>
        </div>
      </form>
    </div>
  );
}
