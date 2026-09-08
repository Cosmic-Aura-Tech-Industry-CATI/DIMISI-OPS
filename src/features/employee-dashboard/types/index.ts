import type { BackendTask, Task } from "@/features/tasks/types";

export interface EmployeeWeeklyProgress {
  day: string;
  planned: number;
  completed: number;
}

export interface EmployeeMonthlyPerformance {
  totalPoints: number;
  pointsGoal: number;
  avgPointsPerDay: number;
  bestDayPoints: number;
  tasksPerWeekAvg: number;
}

export interface EmployeeProgressAnalytics {
  weeklyProgress: EmployeeWeeklyProgress[];
  monthlyPerformance: EmployeeMonthlyPerformance;
}

export interface RawEmployeeTasksDeadlines {
  todayTasks: BackendTask[];
  upcomingDeadlines: BackendTask[];
}

export interface EmployeeTasksDeadlines {
  todayTasks: Task[];
  upcomingDeadlines: Task[];
}
