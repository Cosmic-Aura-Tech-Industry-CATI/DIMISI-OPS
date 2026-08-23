/**
 * Type-safe service functions for the Admin Management module.
 * Communicates with the backend /api/v1/admins endpoints.
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

/** GET /api/v1/admins/stats — retrieves top-level admin metrics. */
export async function getAdminStats(): Promise<AdminStats> {
  const res = await http.get<AdminStatsResponse | AdminStats>(adminEndpoints.stats);
  if (res && typeof res === "object" && "stats" in res) {
    return (res as AdminStatsResponse).stats;
  }
  return res as AdminStats;
}


/** GET /api/v1/admins — retrieves filtered list of administrators. */
export async function getAdmins(filters?: AdminFilters): Promise<AdminListResponse> {
  const res = await http.get<AdminListResponse | { admins: AuthUser[] }>(adminEndpoints.list, {
    params: filters,
  });
  if ("admins" in res) {
    return {
      admins: res.admins,
      pagination: (res as AdminListResponse).pagination,
    };
  }
  return { admins: Array.isArray(res) ? res : [] };
}

/** GET /api/v1/admins/:id — retrieves details for a single administrator. */
export async function getAdminDetails(id: string): Promise<AuthUser> {
  const res = await http.get<AdminSingleResponse | AuthUser>(adminEndpoints.detail(id));
  if ("admin" in res) return res.admin;
  return res as AuthUser;
}

/** PATCH /api/v1/admins/:id — updates an administrator's details. */
export async function updateAdminDetails(
  id: string,
  payload: UpdateAdminPayload,
): Promise<AuthUser> {
  const res = await http.patch<AdminSingleResponse | AuthUser>(
    adminEndpoints.update(id),
    payload,
  );
  if ("admin" in res) return res.admin;
  return res as AuthUser;
}

/** PATCH /api/v1/admins/:id/revoke — revokes an administrator's access. */
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

