/**
 * React Query hook for the Dashboard Overview module.
 * Fetches and caches aggregated metrics for KPIs, charts, and momentum.
 */
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { ApiError } from "@/api/client/errors";
import { queryKeys } from "@/api/client/query-keys";
import { dashboardService } from "../services/dashboard.service";
import type { DashboardOverview } from "../types";

/** GET /api/v1/dashboard/overview */
export function useDashboardOverviewQuery(
  options?: Omit<UseQueryOptions<DashboardOverview, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<DashboardOverview, ApiError>({
    queryKey: queryKeys.dashboard.overview(),
    queryFn: () => dashboardService.getDashboardOverview(),
    staleTime: 60_000, // 1 minute fresh time
    ...options,
  });
}
