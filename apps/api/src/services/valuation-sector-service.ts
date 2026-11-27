import "server-only";
import { ApiError } from "@/lib/http/api-error";
import {
  createValuationCity,
  createValuationSector,
  findValuationCityById,
  findValuationSectorById,
  listValuationCities,
  updateValuationCityBase,
  updateValuationSector,
} from "@/repositories/valuation-sector-repository";
import type {
  ValuationCityBase,
  ValuationCityCreate,
  ValuationCityDto,
  ValuationSectorCreate,
  ValuationSectorDto,
  ValuationSectorSource,
  ValuationSectorUpdate,
} from "@portal/shared/valuation-sector";

type SectorRecord = Awaited<ReturnType<typeof createValuationSector>>;
type CityRecord = Awaited<ReturnType<typeof createValuationCity>>;

const toSectorDto = (sector: SectorRecord): ValuationSectorDto => ({
  id: sector.id,
  cityId: sector.cityId,
  name: sector.name,
  commune: sector.commune,
  latitude: sector.latitude,
  longitude: sector.longitude,
  coefficient: sector.coefficient,
  note: sector.note,
  source: sector.source as ValuationSectorSource,
  updatedAt: sector.updatedAt.toISOString(),
});

const toCityDto = (city: CityRecord, sectors: SectorRecord[] = []): ValuationCityDto => ({
  id: city.id,
  name: city.name,
  houseUfPerM2: city.houseUfPerM2,
  apartmentUfPerM2: city.apartmentUfPerM2,
  landUfPerM2: city.landUfPerM2,
  updatedAt: city.updatedAt.toISOString(),
  sectors: sectors.map(toSectorDto),
});

/** A unique constraint (city name, or sector name within a city) answers 409 instead of 500. */
async function orConflict<T>(action: () => Promise<T>, message: string): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") throw new ApiError(409, message);
    throw error;
  }
}

export async function listReferenceTable(): Promise<ValuationCityDto[]> {
  const cities = await listValuationCities();
  return cities.map((city) => toCityDto(city, city.sectors));
}

export async function addCity(input: ValuationCityCreate): Promise<ValuationCityDto> {
  return toCityDto(await orConflict(() => createValuationCity(input), "Ya existe una ciudad con ese nombre"));
}

export async function changeCityBase(id: string, base: ValuationCityBase): Promise<ValuationCityDto> {
  if (!(await findValuationCityById(id))) throw new ApiError(404, "Ciudad no encontrada");
  return toCityDto(await updateValuationCityBase(id, base));
}

export async function addSector(input: ValuationSectorCreate): Promise<ValuationSectorDto> {
  if (!(await findValuationCityById(input.cityId))) throw new ApiError(404, "Ciudad no encontrada");
  return toSectorDto(await orConflict(() => createValuationSector(input), "Ya existe un sector con ese nombre en la ciudad"));
}

export async function changeSector(id: string, changes: ValuationSectorUpdate): Promise<ValuationSectorDto> {
  if (!(await findValuationSectorById(id))) throw new ApiError(404, "Sector no encontrado");
  return toSectorDto(await orConflict(() => updateValuationSector(id, changes), "Ya existe un sector con ese nombre en la ciudad"));
}
