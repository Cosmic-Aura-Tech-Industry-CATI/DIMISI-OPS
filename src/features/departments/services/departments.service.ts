/**
 * Type-safe service functions for the Departments module.
 * Communicates with the backend /api/v1/departments endpoints.
 */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type { MessageResponse } from "@/types/api";
import type {
  Department,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  DepartmentListResponse,
  DepartmentSingleResponse,
} from "../types";

const { departments: deptEndpoints } = API_ENDPOINTS;

/** GET /api/v1/departments — lists all active departments. */
export async function getDepartments(): Promise<Department[]> {
  const res = await http.get<DepartmentListResponse | Department[]>(
    deptEndpoints.list,
  );
  if (Array.isArray(res)) return res;
  return res?.departments ?? [];
}

/** GET /api/v1/departments/:id — retrieves a single department. */
export async function getDepartment(id: string): Promise<Department> {
  const res = await http.get<DepartmentSingleResponse | Department>(
    deptEndpoints.detail(id),
  );
  if ("department" in res) return res.department;
  return res as Department;
}

/** POST /api/v1/departments — creates a new department. */
export async function createDepartment(
  payload: CreateDepartmentPayload,
): Promise<Department> {
  const res = await http.post<DepartmentSingleResponse | Department>(
    deptEndpoints.create,
    payload,
  );
  if ("department" in res) return res.department;
  return res as Department;
}

/** PATCH /api/v1/departments/:id — updates an existing department. */
export async function updateDepartment(
  id: string,
  payload: UpdateDepartmentPayload,
): Promise<Department> {
  const res = await http.patch<DepartmentSingleResponse | Department>(
    deptEndpoints.update(id),
    payload,
  );
  if ("department" in res) return res.department;
  return res as Department;
}

/** DELETE /api/v1/departments/:id — deactivates (soft deletes) a department. */
export async function deactivateDepartment(id: string): Promise<MessageResponse> {
  return await http.delete<MessageResponse>(deptEndpoints.delete(id));
}

export const departmentsService = {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
};
