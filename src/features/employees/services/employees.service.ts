/**
 * Type-safe service functions for the Employee Management module.
 * Communicates with the backend /api/v1/employees endpoints.
 */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type { AuthUser } from "@/auth/types/auth";
import type { MessageResponse } from "@/types/api";
import type {
  EmployeeFilters,
  EmployeeListResponse,
  EmployeeSingleResponse,
  UpdateEmployeePayload,
} from "../types";

const { employees: employeeEndpoints } = API_ENDPOINTS;

/**
 * Strict whitelist filter sanitizer to prevent backend Mongoose CastErrors (HTTP 400 Bad Request).
 * Only forwards params explicitly handled by backend (status, department ObjectId, 4-digit year, sortOrder, page).
 */
function cleanFilters(filters?: EmployeeFilters): Record<string, unknown> | undefined {
  if (!filters) return undefined;
  const cleaned: Record<string, unknown> = {};

  if (filters.status === "active" || filters.status === "inactive") {
    cleaned.status = filters.status;
  }
  if (typeof filters.department === "string" && /^[0-9a-fA-F]{24}$/.test(filters.department)) {
    cleaned.department = filters.department;
  }
  if (typeof (filters as any).year === "string" && /^\d{4}$/.test((filters as any).year)) {
    cleaned.year = (filters as any).year;
  }
  if (filters.sortOrder === "asc" || filters.sortOrder === "desc") {
    cleaned.sortOrder = filters.sortOrder;
  }
  if (filters.page !== undefined && filters.page !== null && !isNaN(Number(filters.page))) {
    cleaned.page = Number(filters.page);
  }

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

/** GET /api/v1/employees — retrieves filtered list of employees. */
export async function getEmployees(filters?: EmployeeFilters): Promise<EmployeeListResponse> {
  const params = cleanFilters(filters);
  const res = await http.get<EmployeeListResponse | { employees: AuthUser[] }>(
    employeeEndpoints.list,
    { params },
  );
  if (res && typeof res === "object" && "employees" in res) {
    return {
      employees: res.employees,
      pagination: (res as EmployeeListResponse).pagination,
    };
  }
  return { employees: Array.isArray(res) ? res : [] };
}

/** GET /api/v1/employees/:id — retrieves details for a specific employee. */
export async function getEmployeeDetails(id: string): Promise<AuthUser> {
  const res = await http.get<EmployeeSingleResponse | AuthUser>(
    employeeEndpoints.detail(id),
  );
  if (res && typeof res === "object" && "employee" in res) {
    return (res as EmployeeSingleResponse).employee;
  }
  return res as AuthUser;
}

/** PATCH /api/v1/employees/:id — updates an employee's details. */
export async function updateEmployeeDetails(
  id: string,
  payload: UpdateEmployeePayload,
): Promise<AuthUser> {
  const res = await http.patch<EmployeeSingleResponse | AuthUser>(
    employeeEndpoints.update(id),
    payload,
  );
  if (res && typeof res === "object" && "employee" in res) {
    return (res as EmployeeSingleResponse).employee;
  }
  return res as AuthUser;
}

/** PATCH /api/v1/employees/:id/revoke — revokes an employee's access. */
export async function revokeEmployeeAccess(id: string): Promise<MessageResponse> {
  return await http.patch<MessageResponse>(employeeEndpoints.revoke(id));
}

export const employeesService = {
  getEmployees,
  getEmployeeDetails,
  updateEmployeeDetails,
  revokeEmployeeAccess,
};
