export interface DashboardKPI {
  current: number;
  trend: number;
}

export interface TaskCompletionChartItem {
  day: string;
  completed: number;
  created: number;
}

export interface PointsDistributionItem {
  range: string;
  count: number;
}

export interface MonthlyProductivityItem {
  month: string;
  tasksShipped: number;
  pointsEarned: number;
}

export interface DepartmentPerformanceItem {
  department: string;
  tasks: number;
  completionRate: number;
}

export interface WeeklyMomentum {
  pointsDifference: number;
}

export interface TaskDistributionItem {
  department: string;
  count: number;
}

export interface DashboardOverview {
  kpis: {
    totalEmployees: DashboardKPI;
    totalAdmins: DashboardKPI;
    activeTasks: DashboardKPI;
    pendingReviews: DashboardKPI;
    completedTasks: DashboardKPI;
    totalRewardPoints: DashboardKPI;
  };
  taskCompletion: TaskCompletionChartItem[];
  pointsDistribution: PointsDistributionItem[];
  monthlyProductivity: MonthlyProductivityItem[];
  departmentPerformance: DepartmentPerformanceItem[];
  weeklyMomentum: WeeklyMomentum;
  taskDistribution: TaskDistributionItem[];
}

export interface DashboardOverviewResponse {
  status: string;
  data: DashboardOverview;
}
