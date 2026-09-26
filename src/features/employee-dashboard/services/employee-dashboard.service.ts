/** API services for the Employee Dashboard module. */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import { mapTaskResponse } from "@/features/tasks/types";
import type {
  EmployeeProgressAnalytics,
  EmployeeTasksDeadlines,
  RawEmployeeTasksDeadlines,
} from "../types";

export const employeeDashboardService = {
  /** GET /api/v1/employee-dashboard/tasks-deadlines */
  getTasksAndDeadlines: async (): Promise<EmployeeTasksDeadlines> => {
    const raw = await http.get<RawEmployeeTasksDeadlines>(
      API_ENDPOINTS.employeeDashboard.tasksDeadlines,
    );
    return {
      todayTasks: (raw?.todayTasks || []).map((t) => mapTaskResponse(t)),
      upcomingDeadlines: (raw?.upcomingDeadlines || []).map((t) =>
        mapTaskResponse(t),
      ),
    };
  },

  /** GET /api/v1/employee-dashboard/analytics */
  getProgressAnalytics: async (): Promise<EmployeeProgressAnalytics> => {
    const res = await http.get<EmployeeProgressAnalytics>(
      API_ENDPOINTS.employeeDashboard.analytics,
    );
    return res;
  },
};
