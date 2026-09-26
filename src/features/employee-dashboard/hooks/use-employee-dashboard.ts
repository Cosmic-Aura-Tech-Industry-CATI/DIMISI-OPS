/** React Query hooks for the Employee Dashboard module. */
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/client/query-keys";
import { employeeDashboardService } from "../services/employee-dashboard.service";

export function useEmployeeTasksDeadlinesQuery() {
  return useQuery({
    queryKey: queryKeys.employeeDashboard.tasksDeadlines(),
    queryFn: () => employeeDashboardService.getTasksAndDeadlines(),
    staleTime: 30 * 1000,
  });
}

export function useEmployeeProgressAnalyticsQuery() {
  return useQuery({
    queryKey: queryKeys.employeeDashboard.analytics(),
    queryFn: () => employeeDashboardService.getProgressAnalytics(),
    staleTime: 60 * 1000,
  });
}
