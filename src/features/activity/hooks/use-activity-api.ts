/** React Query hooks for the activity module. */
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/client/query-keys";
import { activityService } from "../services/activity.service";
import type { ActivityQueryFilters } from "../types";

export function usePersonalActivityQuery(filters?: ActivityQueryFilters) {
  return useQuery({
    queryKey: queryKeys.activity.personal(filters as Record<string, unknown>),
    queryFn: () => activityService.getPersonalLogs(filters),
    staleTime: 30 * 1000,
  });
}

export function useAdminActivityQuery(filters?: ActivityQueryFilters) {
  return useQuery({
    queryKey: queryKeys.activity.admin(filters as Record<string, unknown>),
    queryFn: () => activityService.getAdminLogs(filters),
    staleTime: 30 * 1000,
  });
}

export function useOrgActivityQuery(filters?: ActivityQueryFilters) {
  return useQuery({
    queryKey: queryKeys.activity.org(filters as Record<string, unknown>),
    queryFn: () => activityService.getOrgLogs(filters),
    staleTime: 30 * 1000,
  });
}
