import { apiClient, http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type { AuthUser } from "@/auth/types/auth";
import type { MessageResponse } from "@/types/api";
import type {
  EmployeeFilters,
  EmployeeListResponse,
  EmployeePagination,
  EmployeeSingleResponse,
  UpdateEmployeePayload,
} from "../types";

const { employees: employeeEndpoints } = API_ENDPOINTS;

/**
 * Strict whitelist filter sanitizer to prevent backend Mongoose CastErrors (HTTP 400 Bad Request).
 * Only forwards params explicitly handled by backend (status, department ObjectId, 4-digit year, sortOrder, page, limit).
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
    cleaned.page = Math.max(1, Number(filters.page));
  }
  if (filters.limit !== undefined && filters.limit !== null && !isNaN(Number(filters.limit))) {
    cleaned.limit = Math.max(1, Number(filters.limit));
  }

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

/** GET /api/v1/employees — retrieves paginated list of employees. */
export async function getEmployees(filters?: EmployeeFilters): Promise<EmployeeListResponse> {
  const params = cleanFilters(filters);
  const res = await apiClient.get<any>(employeeEndpoints.list, { params });
  const raw = res.data;

  let employees: AuthUser[] = [];
  let pagination: EmployeePagination | undefined = undefined;

  if (raw && typeof raw === "object") {
    if (Array.isArray(raw.employees)) {
      employees = raw.employees;
    } else if (Array.isArray(raw.data)) {
      employees = raw.data;
    } else if (raw.data && typeof raw.data === "object" && Array.isArray(raw.data.employees)) {
      employees = raw.data.employees;
    } else if (raw.data && typeof raw.data === "object" && Array.isArray(raw.data.data)) {
      employees = raw.data.data;
    } else if (Array.isArray(raw)) {
      employees = raw;
    }

    const rawPagination = raw.pagination || raw.data?.pagination || raw.meta;
    if (rawPagination) {
      pagination = {
        totalRecords: Number(rawPagination.totalRecords || rawPagination.total || rawPagination.count || employees.length),
        currentPage: Number(rawPagination.currentPage || rawPagination.page || filters?.page || 1),
        totalPages: Number(rawPagination.totalPages || rawPagination.pages || Math.ceil((rawPagination.totalRecords || employees.length) / (filters?.limit || 8))),
        limit: Number(rawPagination.limit || rawPagination.perPage || filters?.limit || 8),
      };
    } else if (raw.totalRecords !== undefined || raw.total !== undefined || raw.totalPages !== undefined) {
      const total = Number(raw.totalRecords ?? raw.total ?? employees.length);
      const limit = Number(raw.limit ?? filters?.limit ?? 8);
      pagination = {
        totalRecords: total,
        currentPage: Number(raw.currentPage ?? raw.page ?? filters?.page ?? 1),
        totalPages: Number(raw.totalPages ?? raw.pages ?? Math.max(1, Math.ceil(total / limit))),
        limit,
      };
    }
  } else if (Array.isArray(raw)) {
    employees = raw;
  }

  return {
    employees,
    pagination,
  };
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
