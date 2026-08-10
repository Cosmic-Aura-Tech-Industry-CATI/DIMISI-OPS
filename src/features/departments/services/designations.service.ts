/**
 * Type-safe service functions for the Designations module.
 * Communicates with the backend /api/v1/designations endpoints.
 * Handles bidirectional mapping between frontend (name) and backend (title).
 */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type { MessageResponse } from "@/types/api";
import {
  type Designation,
  type BackendDesignation,
  type CreateDesignationPayload,
  type UpdateDesignationPayload,
  type DesignationListResponse,
  type DesignationSingleResponse,
  mapBackendToDesignation,
  mapPayloadToBackend,
  mapUpdatePayloadToBackend,
} from "../types";

const { designations: desigEndpoints } = API_ENDPOINTS;

/** GET /api/v1/designations — lists all active designations across all departments. */
export async function getDesignations(): Promise<Designation[]> {
  const res = await http.get<DesignationListResponse | BackendDesignation[]>(
    desigEndpoints.list,
  );
  const rawList: BackendDesignation[] = Array.isArray(res)
    ? res
    : res?.designations ?? [];
  return rawList.map(mapBackendToDesignation);
}

/** GET /api/v1/designations/:id — retrieves a single designation. */
export async function getDesignation(id: string): Promise<Designation> {
  const res = await http.get<DesignationSingleResponse | BackendDesignation>(
    desigEndpoints.detail(id),
  );
  const rawDoc: BackendDesignation =
    res && typeof res === "object" && "designation" in res
      ? (res as DesignationSingleResponse).designation
      : (res as BackendDesignation);
  return mapBackendToDesignation(rawDoc);
}

/** GET /api/v1/designations/department/:departmentId — retrieves designations for a specific department. */
export async function getDesignationsByDepartment(
  departmentId: string,
): Promise<Designation[]> {
  if (!departmentId) return [];
  const res = await http.get<DesignationListResponse | BackendDesignation[]>(
    desigEndpoints.byDepartment(departmentId),
  );
  const rawList: BackendDesignation[] = Array.isArray(res)
    ? res
    : res?.designations ?? [];
  return rawList.map(mapBackendToDesignation);
}

/** POST /api/v1/designations — creates a new designation (maps name -> title). */
export async function createDesignation(
  payload: CreateDesignationPayload,
): Promise<Designation> {
  const backendBody = mapPayloadToBackend(payload);
  const res = await http.post<DesignationSingleResponse | BackendDesignation>(
    desigEndpoints.create,
    backendBody,
  );
  const rawDoc: BackendDesignation =
    res && typeof res === "object" && "designation" in res
      ? (res as DesignationSingleResponse).designation
      : (res as BackendDesignation);
  return mapBackendToDesignation(rawDoc);
}

/** PATCH /api/v1/designations/:id — updates an existing designation. */
export async function updateDesignation(
  id: string,
  payload: UpdateDesignationPayload,
): Promise<Designation> {
  const backendBody = mapUpdatePayloadToBackend(payload);
  const res = await http.patch<DesignationSingleResponse | BackendDesignation>(
    desigEndpoints.update(id),
    backendBody,
  );
  const rawDoc: BackendDesignation =
    res && typeof res === "object" && "designation" in res
      ? (res as DesignationSingleResponse).designation
      : (res as BackendDesignation);
  return mapBackendToDesignation(rawDoc);
}

/** DELETE /api/v1/designations/:id — deactivates (soft deletes) a designation. */
export async function deactivateDesignation(id: string): Promise<MessageResponse> {
  return await http.delete<MessageResponse>(desigEndpoints.delete(id));
}

export const designationsService = {
  getDesignations,
  getDesignation,
  getDesignationsByDepartment,
  createDesignation,
  updateDesignation,
  deactivateDesignation,
};
