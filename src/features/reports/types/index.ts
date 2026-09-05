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
