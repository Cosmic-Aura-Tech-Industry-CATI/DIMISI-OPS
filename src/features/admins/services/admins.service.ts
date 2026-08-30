/**
 * Type-safe service functions for the Admin Management module.
 * Communicates with the backend /api/v1/admins endpoints directly from database.
 */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type { AuthUser } from "@/auth/types/auth";
import type { MessageResponse } from "@/types/api";
import type {
  AdminFilters,
  AdminListResponse,
  AdminSingleResponse,
  AdminStats,
  AdminStatsResponse,
  UpdateAdminPayload,
} from "../types";

const { admins: adminEndpoints } = API_ENDPOINTS;

/**
 * Strict whitelist filter sanitizer to prevent backend Mongoose CastErrors (HTTP 400 Bad Request).
 */
function cleanFilters(filters?: AdminFilters): Record<string, unknown> | undefined {
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

/** GET /api/v1/admins/stats — retrieves top-level admin metrics directly from backend database. */
export async function getAdminStats(): Promise<AdminStats> {
  const res = await http.get<AdminStatsResponse | AdminStats>(adminEndpoints.stats);
  if (res && typeof res === "object" && "stats" in res) {
    return (res as AdminStatsResponse).stats;
  }
  return res as AdminStats;
}

/** GET /api/v1/admins — retrieves filtered list of administrators directly from backend database. */
export async function getAdmins(filters?: AdminFilters): Promise<AdminListResponse> {
  const params = cleanFilters(filters);
  const res = await http.get<AdminListResponse | { admins: AuthUser[] }>(adminEndpoints.list, {
    params,
  });
  if (res && typeof res === "object" && "admins" in res) {
    return {
      admins: res.admins,
      pagination: (res as AdminListResponse).pagination,
    };
  }
  return { admins: Array.isArray(res) ? res : [] };
}

/** GET /api/v1/admins/:id — retrieves details for a single administrator directly from backend database. */
export async function getAdminDetails(id: string): Promise<AuthUser> {
  const res = await http.get<AdminSingleResponse | AuthUser>(adminEndpoints.detail(id));
  if (res && typeof res === "object" && "admin" in res) return res.admin;
  return res as AuthUser;
}

/** PATCH /api/v1/admins/:id — updates an administrator's details directly in backend database. */
export async function updateAdminDetails(
  id: string,
  payload: UpdateAdminPayload,
): Promise<AuthUser> {
  const res = await http.patch<AdminSingleResponse | AuthUser>(
    adminEndpoints.update(id),
    payload,
  );
  if (res && typeof res === "object" && "admin" in res) return res.admin;
  return res as AuthUser;
}

/** PATCH /api/v1/admins/:id/revoke — revokes an administrator's access directly in backend database. */
export async function revokeAdminAccess(id: string): Promise<MessageResponse> {
  return await http.patch<MessageResponse>(adminEndpoints.revoke(id));
}

export const adminsService = {
  getAdminStats,
  getAdmins,
  getAdminDetails,
  updateAdminDetails,
  revokeAdminAccess,
};
