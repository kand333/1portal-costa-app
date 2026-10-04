import type { AdminFeature } from "@portal/shared/feature";
import { sendJson } from "./api-client";

export const ADMIN_FEATURES_PATH = "/admin/properties/features";

export function createFeature(name: string): Promise<AdminFeature> {
  return sendJson<AdminFeature>("POST", "/api/admin/features", { name });
}

export function renameFeature(id: string, name: string): Promise<AdminFeature> {
  return sendJson<AdminFeature>("PUT", `/api/admin/features/${id}`, { name });
}

export function deleteFeature(id: string): Promise<void> {
  return sendJson<void>("DELETE", `/api/admin/features/${id}`);
}
