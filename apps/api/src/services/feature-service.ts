import "server-only";
import { ApiError } from "@/lib/http/api-error";
import {
  deleteFeatureDetached,
  findFeatureById,
  findFeatureWithSameName,
  findFeaturesWithUsage,
  insertFeature,
  renameFeature,
} from "@/repositories/feature-repository";
import type { AdminFeature, FeatureInput } from "@portal/shared/feature";

const NOT_FOUND = "Característica no encontrada";
const DUPLICATE = "Ya existe una característica con ese nombre";

export function listFeatures(): Promise<AdminFeature[]> {
  return findFeaturesWithUsage();
}

/** Adds a feature to the catalog; a name that exists ignoring case is a duplicate (409). */
export async function createFeature({ name }: FeatureInput): Promise<AdminFeature> {
  if (await findFeatureWithSameName(name)) throw new ApiError(409, DUPLICATE);
  return { ...(await insertFeature(name)), propertyCount: 0 };
}

/** Renames a feature everywhere it is used (properties link to it by id). */
export async function updateFeature(id: string, { name }: FeatureInput): Promise<AdminFeature> {
  const feature = await findFeatureById(id);
  if (!feature) throw new ApiError(404, NOT_FOUND);
  // The same feature may change only its case ("piscina" → "Piscina").
  if (await findFeatureWithSameName(name, id)) throw new ApiError(409, DUPLICATE);
  return { ...(await renameFeature(id, name)), propertyCount: feature._count.properties };
}

/** Deletes a feature that no active property uses (409 otherwise: remove it from those properties first). */
export async function removeFeature(id: string): Promise<void> {
  const feature = await findFeatureById(id);
  if (!feature) throw new ApiError(404, NOT_FOUND);
  const inUse = feature._count.properties;
  if (inUse > 0) {
    throw new ApiError(409, `«${feature.name}» está en ${inUse === 1 ? "1 propiedad" : `${inUse} propiedades`}: quítala de ellas antes de eliminarla`);
  }
  await deleteFeatureDetached(id);
}
