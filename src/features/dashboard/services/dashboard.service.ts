/**
 * Type-safe service functions for the Dashboard Overview module.
 * Communicates with the backend /api/v1/dashboard/overview endpoint directly.
 */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type { DashboardOverview } from "../types";

const { dashboard: dashboardEndpoints } = API_ENDPOINTS;

/** GET /api/v1/dashboard/overview — retrieves comprehensive admin dashboard metrics from MongoDB. */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  const res = await http.get<DashboardOverview>(dashboardEndpoints.overview);
  return res;
}

export const dashboardService = {
  getDashboardOverview,
};
