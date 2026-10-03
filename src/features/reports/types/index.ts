export type TimeframeFilter = "weekly" | "monthly" | "quarterly" | "yearly";

export interface ReportKPI {
  current: number;
  trend: number;
}

export interface ReportsOverviewData {
  kpis: {
    totalEmployees: ReportKPI;
    tasksCompleted: ReportKPI;
    totalRewardPoints: ReportKPI;
  };
  weeklyCompletion: {
    day: string;
    created: number;
    completed: number;
  }[];
  taskStatusMix: {
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  priorityMix: {
    high: number;
    medium: number;
    low: number;
  };
  pointsVelocity: {
    weekLabel: string;
    points: number;
  }[];
}

export interface EmployeeReportItem {
  _id?: string;
  name: string;
  empId?: string;
  department?: string | { _id: string; name: string };
  points: number;
  assigned: number;
  completed: number;
  overdue: number;
}

export interface TaskReportKPI {
  _id: string;
  count: number;
}

export interface TaskReportTableItem {
  _id: string;
  title: string;
  assignedTo?: string | { _id: string; name: string };
  category?: string | { _id: string; name: string };
  priority: string;
  status: string;
  rewardPoints: number;
  deadline?: string;
  createdAt?: string;
}

export interface TaskReportsData {
  kpis: TaskReportKPI[];
  tableData: TaskReportTableItem[];
}

export interface ProjectReportItem {
  _id?: string;
  projectId?: string;
  name: string;
  manager?: string;
  status: string;
  totalTasks: number;
  completedTasks: number;
}

export interface DepartmentReportItem {
  _id: string;
  department?: string;
  headcount: number;
  totalPoints: number;
  totalAssigned: number;
  totalCompleted: number;
}

export interface ReportEstimateData {
  type: string;
  format: string;
  timeframe?: string;
  rows?: number;
  threshold?: number;
  recommended: "sync" | "async";
  estimatedSeconds?: number;
}

export interface DownloadJobCreationResult {
  status?: string;
  jobId: string;
  statusUrl?: string;
}

export interface DownloadJobStatusResult {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed" | "expired";
  progress?: number;
  downloadUrl?: string;
  fileSize?: number;
  error?: string;
  expiresAt?: string;
}

export type EstimateReportType = "tasks" | "projects" | "employees" | "departments";
export type AsyncJobReportType =
  "report:task" | "report:project" | "report:employee" | "report:department";

export type ReportCategoryType =
  | "overview"
  | "employees"
  | "tasks"
  | "projects"
  | "departments"
  | "employee"
  | "task"
  | "project"
  | "department";

export const estimateTypeMap: Record<string, EstimateReportType> = {
  task: "tasks",
  tasks: "tasks",
  project: "projects",
  projects: "projects",
  employee: "employees",
  employees: "employees",
  department: "departments",
  departments: "departments",
  overview: "tasks",
};

export const reportTypeMap = estimateTypeMap;

/**
 * Centralized mapping function for Report Estimate API.
 * Converts UI report keys into the valid types accepted by the backend:
 * 'tasks', 'projects', 'employees', 'departments'.
 */
export function mapToEstimateType(type: string): EstimateReportType {
  const normalized = (type || "").toLowerCase().trim();
  return estimateTypeMap[normalized] || "tasks";
}

/**
 * Centralized mapping function for Asynchronous Download Job API.
 * Formats report types into the namespaced job format ('report:employee', 'report:task', 'report:project', 'report:department').
 */
export function mapToAsyncJobType(type: string): AsyncJobReportType | string {
  const normalized = (type || "").toLowerCase().trim();
  switch (normalized) {
    case "employees":
    case "employee":
      return "report:employee";
    case "projects":
    case "project":
      return "report:project";
    case "departments":
    case "department":
      return "report:department";
    case "account":
    case "accounts":
    case "account:data":
      return "account:data";
    case "tasks":
    case "task":
    case "overview":
    default:
      return "report:task";
  }
}

/**
 * Normalizes user-selected file format string to the backend supported formats ('csv', 'excel', 'pdf', 'json').
 */
export function normalizeDownloadFormat(format: string): "csv" | "excel" | "pdf" | "json" {
  const f = (format || "").toLowerCase().trim();
  if (f === "xlsx" || f === "xls" || f === "excel") return "excel";
  if (f === "pdf") return "pdf";
  if (f === "json") return "json";
  return "csv";
}
