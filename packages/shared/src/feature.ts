import { z } from "zod";
import { FEATURE_NAME_MAX_LENGTH } from "./admin-property";

/** Body of `POST /api/admin/features` and `PUT /api/admin/features/{id}`. */
export const featureInputSchema = z.object({
  name: z
    .string({ error: "Ingresa el nombre de la característica" })
    .trim()
    .min(2, { error: "Ingresa el nombre de la característica" })
    .max(FEATURE_NAME_MAX_LENGTH, { error: `Máximo ${FEATURE_NAME_MAX_LENGTH} caracteres` }),
});
export type FeatureInput = z.output<typeof featureInputSchema>;

export const featureIdSchema = z.uuid();

/** A feature of the catalog, with how many active (not deleted) properties use it. */
export type AdminFeature = { id: string; name: string; propertyCount: number };
