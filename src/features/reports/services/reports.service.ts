/** API services for the reports module. */
import { http } from "@/api/client/client";
import { API_BASE_URL } from "@/api/client/config";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import {
  mapToEstimateType,
  mapToAsyncJobType,
  normalizeDownloadFormat,
  type DepartmentReportItem,
  type DownloadJobCreationResult,
  type DownloadJobStatusResult,
  type EmployeeReportItem,
  type ProjectReportItem,
  type ReportEstimateData,
  type ReportsOverviewData,
  type TaskReportsData,
  type TimeframeFilter,
} from "../types";

/**
 * Resolves the backend downloads endpoint without duplicate path segments.
 * Backend download router is mounted at /api/downloads (outside of /v1).
 */
function resolveDownloadsUrl(jobId?: string): string {
  const rawBase = API_BASE_URL || "/api/v1";
  const apiRoot = rawBase.replace(/\/v1\/?$/, "");
  const endpoint = jobId
    ? API_ENDPOINTS.reports.downloadDetail(jobId)
    : API_ENDPOINTS.reports.downloads;
  const path = `${apiRoot}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path.startsWith("/") ? "" : "/"}${path}`;
  }
  return path;
}

/**
 * Helper to trigger file download in browser from a remote URL.
 */
export function triggerUrlDownload(url: string, fileName?: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  if (fileName) {
    link.download = fileName;
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Helper to trigger file download in browser from a Blob.
 */
export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export const reportsService = {
  getEstimate: async (
    type: string,
    format: "csv" | "xlsx" | "pdf" | "json",
    timeframe: TimeframeFilter = "monthly",
  ): Promise<ReportEstimateData> => {
    const estimateType = mapToEstimateType(type);
    const res = await http.get<ReportEstimateData>(API_ENDPOINTS.reports.estimate, {
      params: {
        type: estimateType,
        format,
        ...(timeframe ? { timeframe } : {}),
      },
    });
    return res;
  },

  createDownloadJob: async (
    type: string,
    format: "csv" | "xlsx" | "pdf" | "json",
    timeframe: TimeframeFilter = "monthly",
  ): Promise<DownloadJobCreationResult> => {
    const jobType = mapToAsyncJobType(type);
    const normalizedFormat = normalizeDownloadFormat(format);
    const payload = {
      type: jobType,
      format: normalizedFormat,
      timeframe,
      isLogo: true,
    };

    const downloadUrl = resolveDownloadsUrl();
    const res = await http.post<DownloadJobCreationResult>(downloadUrl, payload);
    return res;
  },

  getDownloadJobStatus: async (jobId: string): Promise<DownloadJobStatusResult> => {
    const statusUrl = resolveDownloadsUrl(jobId);
    const res = await http.get<DownloadJobStatusResult>(statusUrl);
    return res;
  },

  /**
   * Polls the download job until completion or failure.
   * Checks every 2 seconds for a maximum of 60 attempts (2 minutes timeout).
   */
  pollDownloadJob: async (
    jobId: string,
    onStatusUpdate?: (status: DownloadJobStatusResult) => void,
    intervalMs = 2000,
    maxAttempts = 60,
  ): Promise<DownloadJobStatusResult> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusResult = await reportsService.getDownloadJobStatus(jobId);
      onStatusUpdate?.(statusResult);

      if (statusResult.status === "completed") {
        if (!statusResult.downloadUrl) {
          throw new Error("Job completed but download URL was not provided.");
        }
        return statusResult;
      }

      if (statusResult.status === "failed") {
        throw new Error(statusResult.error || "Async report generation failed on server.");
      }

      if (statusResult.status === "expired") {
        throw new Error("The requested report download has expired.");
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error("Report generation timed out. Please check back shortly.");
  },

  getOverview: async (timeframe: TimeframeFilter = "weekly"): Promise<ReportsOverviewData> => {
    const res = await http.get<ReportsOverviewData>(API_ENDPOINTS.reports.overview, {
      params: { timeframe },
    });
    return (
      res ?? {
        kpis: {
          totalEmployees: { current: 0, trend: 0 },
          tasksCompleted: { current: 0, trend: 0 },
          totalRewardPoints: { current: 0, trend: 0 },
        },
        weeklyCompletion: [],
        taskStatusMix: { pending: 0, inProgress: 0, completed: 0, overdue: 0 },
        priorityMix: { high: 0, medium: 0, low: 0 },
        pointsVelocity: [],
      }
    );
  },

  getEmployees: async (): Promise<EmployeeReportItem[]> => {
    const res = await http.get<EmployeeReportItem[]>(API_ENDPOINTS.reports.employees);
    return Array.isArray(res) ? res : [];
  },

  getTasks: async (timeframe: TimeframeFilter = "weekly"): Promise<TaskReportsData> => {
    const res = await http.get<TaskReportsData[] | TaskReportsData>(API_ENDPOINTS.reports.tasks, {
      params: { timeframe },
    });
    if (Array.isArray(res)) {
      return res[0] || { kpis: [], tableData: [] };
    }
    return res ?? { kpis: [], tableData: [] };
  },

  getProjects: async (timeframe: TimeframeFilter = "weekly"): Promise<ProjectReportItem[]> => {
    const res = await http.get<ProjectReportItem[]>(API_ENDPOINTS.reports.projects, {
      params: { timeframe },
    });
    return Array.isArray(res) ? res : [];
  },

  getDepartments: async (): Promise<DepartmentReportItem[]> => {
    const res = await http.get<DepartmentReportItem[]>(API_ENDPOINTS.reports.departments);
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
