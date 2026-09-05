/** React Query hooks for the reports module. */
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/client/query-keys";
import { reportsService } from "../services/reports.service";
import type { TimeframeFilter } from "../types";

export function useReportsOverviewQuery(timeframe: TimeframeFilter = "weekly") {
  return useQuery({
    queryKey: queryKeys.reports.overview(timeframe),
    queryFn: () => reportsService.getOverview(timeframe),
    staleTime: 30 * 1000,
  });
}

export function useEmployeeReportsQuery() {
  return useQuery({
    queryKey: queryKeys.reports.employees(),
    queryFn: () => reportsService.getEmployees(),
    staleTime: 30 * 1000,
  });
}

export function useTaskReportsQuery(timeframe: TimeframeFilter = "weekly") {
  return useQuery({
    queryKey: queryKeys.reports.tasks(timeframe),
    queryFn: () => reportsService.getTasks(timeframe),
    staleTime: 30 * 1000,
  });
}

export function useProjectReportsQuery(timeframe: TimeframeFilter = "weekly") {
  return useQuery({
    queryKey: queryKeys.reports.projects(timeframe),
    queryFn: () => reportsService.getProjects(timeframe),
    staleTime: 30 * 1000,
  });
}

export function useDepartmentReportsQuery() {
  return useQuery({
    queryKey: queryKeys.reports.departments(),
    queryFn: () => reportsService.getDepartments(),
    staleTime: 30 * 1000,
  });
}

export function useExportReportMutation() {
  return useMutation({
    mutationFn: ({
      type,
      format,
      timeframe,
    }: {
      type: "overview" | "employees" | "tasks" | "projects" | "departments";
      format: "csv" | "xlsx" | "pdf" | "json";
      timeframe?: TimeframeFilter;
    }) => reportsService.exportReport(type, format, timeframe),
  });
}
