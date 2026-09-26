/** API services for the reports module. */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type {
  DepartmentReportItem,
  EmployeeReportItem,
  ProjectReportItem,
  ReportsOverviewData,
  TaskReportsData,
  TimeframeFilter,
} from "../types";

export const reportsService = {
  getOverview: async (timeframe: TimeframeFilter = "weekly"): Promise<ReportsOverviewData> => {
    const res = await http.get<ReportsOverviewData>(
      API_ENDPOINTS.reports.overview,
      { params: { timeframe } },
    );
    return res ?? {
      kpis: {
        totalEmployees: { current: 0, trend: 0 },
        tasksCompleted: { current: 0, trend: 0 },
        totalRewardPoints: { current: 0, trend: 0 },
      },
      weeklyCompletion: [],
      taskStatusMix: { pending: 0, inProgress: 0, completed: 0, overdue: 0 },
      priorityMix: { high: 0, medium: 0, low: 0 },
      pointsVelocity: [],
    };
  },

  getEmployees: async (): Promise<EmployeeReportItem[]> => {
    const res = await http.get<EmployeeReportItem[]>(
      API_ENDPOINTS.reports.employees,
    );
    return Array.isArray(res) ? res : [];
  },

  getTasks: async (timeframe: TimeframeFilter = "weekly"): Promise<TaskReportsData> => {
    const res = await http.get<TaskReportsData[] | TaskReportsData>(
      API_ENDPOINTS.reports.tasks,
      { params: { timeframe } },
    );
    if (Array.isArray(res)) {
      return res[0] || { kpis: [], tableData: [] };
    }
    return res ?? { kpis: [], tableData: [] };
  },

  getProjects: async (timeframe: TimeframeFilter = "weekly"): Promise<ProjectReportItem[]> => {
    const res = await http.get<ProjectReportItem[]>(
      API_ENDPOINTS.reports.projects,
      { params: { timeframe } },
    );
    return Array.isArray(res) ? res : [];
  },

  getDepartments: async (): Promise<DepartmentReportItem[]> => {
    const res = await http.get<DepartmentReportItem[]>(
      API_ENDPOINTS.reports.departments,
    );
    return Array.isArray(res) ? res : [];
  },

  exportReport: async (
    type: "overview" | "employees" | "tasks" | "projects" | "departments",
    format: "csv" | "xlsx" | "pdf" | "json",
    timeframe?: TimeframeFilter,
  ): Promise<Blob> => {
    const endpointMap = {
      overview: API_ENDPOINTS.reports.overview,
      employees: API_ENDPOINTS.reports.employees,
      tasks: API_ENDPOINTS.reports.tasks,
      projects: API_ENDPOINTS.reports.projects,
      departments: API_ENDPOINTS.reports.departments,
    };
    const res = await http.get(endpointMap[type], {
      params: { export: format, ...(timeframe ? { timeframe } : {}) },
      responseType: "blob",
    });
    return res as unknown as Blob;
  },
};
