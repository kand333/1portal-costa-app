import type {
  ValuationCityBase,
  ValuationCityCreate,
  ValuationCityDto,
  ValuationSectorCreate,
  ValuationSectorDto,
  ValuationSectorUpdate,
} from "@portal/shared/valuation-sector";
import { sendJson } from "./api-client";

export const ADMIN_VALUATION_SECTORS_PATH = "/admin/valuation-sectors";
const API_PATH = "/api/admin/valuation-sectors";

export function createValuationCity(input: ValuationCityCreate): Promise<ValuationCityDto> {
  return sendJson<ValuationCityDto>("POST", `${API_PATH}/cities`, input);
}

export function updateValuationCityBase(id: string, base: ValuationCityBase): Promise<ValuationCityDto> {
  return sendJson<ValuationCityDto>("PATCH", `${API_PATH}/cities/${id}`, base);
}

export function createValuationSector(input: ValuationSectorCreate): Promise<ValuationSectorDto> {
  return sendJson<ValuationSectorDto>("POST", API_PATH, input);
}

export function updateValuationSector(id: string, changes: ValuationSectorUpdate): Promise<ValuationSectorDto> {
  return sendJson<ValuationSectorDto>("PATCH", `${API_PATH}/${id}`, changes);
}

/** UF per square meter of a sector: the city base times the sector coefficient. */
export function sectorUfPerSquareMeter(base: number, coefficient: number): number {
  return Math.round(base * coefficient * 10) / 10;
}
