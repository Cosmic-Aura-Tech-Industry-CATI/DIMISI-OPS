/**
 * Tasks API Service Layer
 * Centralizes all communication with backend task endpoints with seamless payload unwrapping & seed fallbacks.
 */

import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import { tasks as mockTasks } from "@/lib/mock-data";
import {
  buildCreateTaskFormData,
  buildUpdateTaskFormData,
  mapTaskResponse,
  type CreateTaskInput,
  type Task,
  type TaskQueryFilters,
  type UpdateTaskInput,
} from "../types";

const fallbackTasks: Task[] = mockTasks.map((t) => ({
  ...t,
  _id: t._id || t.id || "",
  id: t.id || t._id || "",
  title: t.title || "",
  description: t.description || "",
  category: t.category || "General",
  priority: (t.priority as any) || "medium",
  status: (t.status as any) || "pending",
  taskType: t.taskType || "direct",
  points: Number(t.points || 0),
  dueDate: t.dueDate || "",
  createdAt: t.createdAt || "",
  assignee: t.assignee || "",
  assigneeId: t.assigneeId || "",
}));

export const tasksService = {
  /**
   * Fetch all tasks (Smart endpoint: returns unmasked tasks for Admin/Director or masked for Employee).
   */
  async getTasks(filters?: TaskQueryFilters): Promise<Task[]> {
    try {
      const res = await http.get<any>(API_ENDPOINTS.tasks.list, {
        params: filters,
      });
      const rawList = Array.isArray(res)
        ? res
        : res?.tasks || res?.data?.tasks || (res?.data && Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(rawList)) {
        return rawList.map(mapTaskResponse);
      }
    } catch (err) {
      console.warn("[tasksService.getTasks] API call failed, using fallback:", err);
    }
    return fallbackTasks;
  },

  /**
   * Fetch single task details by ID.
   */
  async getTaskById(id: string): Promise<Task> {
    try {
      const res = await http.get<any>(API_ENDPOINTS.tasks.detail(id));
      const raw = res?.task || res?.data?.task || res;
      if (raw && (raw._id || raw.id || raw.title)) {
        return mapTaskResponse(raw);
      }
    } catch (err) {
      console.warn(`[tasksService.getTaskById] Failed to fetch task ${id}, using fallback:`, err);
    }
    const found = fallbackTasks.find((t) => t.id === id || t._id === id);
    if (found) return found;
    throw new Error("Task not found");
  },

  /**
   * Admin creates a new task (Universal, Project, or Direct) with optional file attachments.
   */
  async createTask(input: CreateTaskInput | FormData): Promise<Task> {
    const body = input instanceof FormData ? input : buildCreateTaskFormData(input);
    const res = await http.post<any>(API_ENDPOINTS.tasks.create, body);
    const raw = res?.task || res?.data?.task || res;
    return mapTaskResponse(raw);
  },

  /**
   * Admin updates a task and syncs Cloudinary attachments.
   */
  async updateTask(id: string, input: UpdateTaskInput | FormData): Promise<Task> {
    const body = input instanceof FormData ? input : buildUpdateTaskFormData(input);
    const res = await http.patch<any>(API_ENDPOINTS.tasks.update(id), body);
    const raw = res?.task || res?.data?.task || res;
    return mapTaskResponse(raw);
  },

  /**
   * Admin deletes a task permanently.
   */
  async deleteTask(id: string): Promise<void> {
    await http.delete(API_ENDPOINTS.tasks.delete(id));
  },

  /**
   * Employee places a request (bid) on an open Universal/Project task.
   */
  async requestTask(id: string): Promise<void> {
    await http.post(API_ENDPOINTS.tasks.request(id));
  },

  /**
   * Admin assigns a task to an employee (Approving a bid or direct assign).
   */
  async assignTask(id: string, employeeId: string): Promise<Task> {
    const res = await http.patch<any>(API_ENDPOINTS.tasks.assign(id), {
      employeeId,
    });
    const raw = res?.task || res?.data?.task || res;
    return mapTaskResponse(raw);
  },

  /**
   * Employee starts working on an assigned task (ASSIGNED -> IN_PROGRESS).
   */
  async startTask(id: string): Promise<Task> {
    const res = await http.patch<any>(API_ENDPOINTS.tasks.start(id));
    const raw = res?.task || res?.data?.task || res;
    return mapTaskResponse(raw);
  },

  /**
   * Employee submits an in-progress task for Admin review (IN_PROGRESS -> IN_REVIEW).
   */
  async submitTaskForReview(id: string, notes?: string): Promise<Task> {
    const res = await http.patch<any>(API_ENDPOINTS.tasks.submit(id), {
      notes,
    });
    const raw = res?.task || res?.data?.task || res;
    return mapTaskResponse(raw);
  },

  /**
   * Admin reviews a submitted task (IN_REVIEW -> COMPLETED if approved or IN_PROGRESS if rejected).
   */
  async reviewTask(id: string, isApproved: boolean, feedback?: string): Promise<Task> {
    const res = await http.patch<any>(API_ENDPOINTS.tasks.review(id), {
      isApproved,
      feedback,
      action: isApproved ? "APPROVED" : "REJECTED",
      remarks: feedback,
    });
    const raw = res?.task || res?.data?.task || res;
    return mapTaskResponse(raw);
  },

  /**
   * Admin fetches the Review Center overview with KPIs and pending review tasks.
   */
  async getReviewCenter(): Promise<{ kpis: { pendingReview: number; highPriority: number; pointsAtStake: number }; tasks: Task[] }> {
    try {
      const res = await http.get<any>(API_ENDPOINTS.tasks.reviewCenter);
      const rawList = Array.isArray(res)
        ? res
        : res?.tasks || res?.data?.tasks || (res?.data && Array.isArray(res.data) ? res.data : []);
      const tasks = (rawList || []).map(mapTaskResponse);
      const kpis = res?.kpis || res?.data?.kpis || { pendingReview: tasks.length, highPriority: 0, pointsAtStake: 0 };
      if (Array.isArray(rawList)) {
        const tasks = rawList.map(mapTaskResponse);
        const kpis = res?.kpis || res?.data?.kpis || {
          pendingReview: tasks.length,
          highPriority: tasks.filter((t) => t.priority === "high").length,
          pointsAtStake: tasks.reduce((sum, t) => sum + t.points, 0),
        };
        return { kpis, tasks };
      }
    } catch (err) {
      console.warn("[tasksService.getReviewCenter] API call failed, using fallback:", err);
    }
    const mockInReview = fallbackTasks.filter(
      (t) => t.reviewState === "in_review" || (t.status as string) === "In Review",
    );
    return {
      kpis: {
        pendingReview: mockInReview.length,
        highPriority: mockInReview.filter((t) => t.priority === "high").length,
        pointsAtStake: mockInReview.reduce((sum, t) => sum + t.points, 0),
      },
      tasks: mockInReview,
    };
  },

  /**
   * Employee fetches assigned tasks bucket.
   */
  async getAssignedTasks(): Promise<Task[]> {
    try {
      const res = await http.get<any>(API_ENDPOINTS.tasks.assigned);
      const rawList = Array.isArray(res)
        ? res
        : res?.tasks || res?.data?.tasks || (res?.data && Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(rawList)) {
        return rawList.map(mapTaskResponse);
      }
    } catch (err) {
      console.warn("[tasksService.getAssignedTasks] API call failed, using fallback:", err);
    }
    return fallbackTasks.filter((t) => t.status === "assigned" || t.status === "pending" || t.status === "in_progress");
  },

  /**
   * Employee fetches pending tasks bucket.
   */
  async getPendingTasks(): Promise<Task[]> {
    try {
      const res = await http.get<any>(API_ENDPOINTS.tasks.pending);
      const rawList = Array.isArray(res)
        ? res
        : res?.tasks || res?.data?.tasks || (res?.data && Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(rawList)) {
        return rawList.map(mapTaskResponse);
      }
    } catch (err) {
      console.warn("[tasksService.getPendingTasks] API call failed, using fallback:", err);
    }
    return fallbackTasks.filter((t) => t.reviewState === "in_review" || (t.status as string) === "In Review");
  },

  /**
   * Employee fetches completed tasks bucket.
   */
  async getCompletedTasks(): Promise<Task[]> {
    try {
      const res = await http.get<any>(API_ENDPOINTS.tasks.completed);
      const rawList = Array.isArray(res)
        ? res
        : res?.tasks || res?.data?.tasks || (res?.data && Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(rawList)) {
        return rawList.map(mapTaskResponse);
      }
    } catch (err) {
      console.warn("[tasksService.getCompletedTasks] API call failed, using fallback:", err);
    }
    return fallbackTasks.filter((t) => t.status === "completed" || t.reviewState === "approved");
  },
};
