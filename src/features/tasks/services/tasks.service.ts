/**
 * Tasks API Service Layer
 * Centralizes all communication with backend task endpoints using standard Axios client.
 */

import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import {
  buildCreateTaskFormData,
  buildUpdateTaskFormData,
  mapTaskResponse,
  type CreateTaskInput,
  type ReviewCenterResponse,
  type ReviewTaskPayload,
  type SubmitTaskPayload,
  type Task,
  type TaskQueryFilters,
  type UpdateTaskInput,
} from "../types";

export const tasksService = {
  /**
   * Fetch all tasks (Smart endpoint: returns unmasked tasks for Admin/Director or masked for Employee).
   */
  async getTasks(filters?: TaskQueryFilters): Promise<Task[]> {
    const res = await http.get<any>(API_ENDPOINTS.tasks.list, {
      params: filters,
    });
    const rawList = Array.isArray(res)
      ? res
      : res?.tasks || res?.data?.tasks || (res?.data && Array.isArray(res.data) ? res.data : []);

    if (Array.isArray(rawList)) {
      return rawList.map(mapTaskResponse);
    }
    return [];
  },

  /**
   * Fetch single task details by ID.
   */
  async getTaskById(id: string): Promise<Task> {
    const res = await http.get<any>(API_ENDPOINTS.tasks.detail(id));
    const raw = res?.task || res?.data?.task || res;
    return mapTaskResponse(raw);
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
   * Employee requests assignment on an available task (POST /tasks/:id/request).
   * Returns { status, message } from backend.
   */
  async requestTask(id: string): Promise<{ status: string; message: string }> {
    const res = await http.post<any>(API_ENDPOINTS.tasks.request(id));
    return res ?? { status: "success", message: "Task request submitted successfully." };
  },

  /**
   * Admin assigns a task to an employee.
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
  async submitTask(id: string, payload: SubmitTaskPayload | { notes?: string } | string): Promise<Task> {
    const body = typeof payload === "string" ? { notes: payload } : payload;
    try {
      const res = await http.patch<any>(API_ENDPOINTS.tasks.submit(id), body);
      const raw = res?.task || res?.data?.task || res;
      return mapTaskResponse(raw);
    } catch (err: any) {
      // If backend throws error stating task must be 'In Progress' first or not assigned, auto-start and retry
      const errMsg = err?.message || err?.response?.data?.message || "";
      const status = err?.status || err?.response?.status;
      if (
        typeof errMsg === "string" &&
        (errMsg.toLowerCase().includes("in progress") ||
          errMsg.toLowerCase().includes("in_progress") ||
          errMsg.toLowerCase().includes("assigned") ||
          status === 400 ||
          status === 403)
      ) {
        try {
          await http.patch<any>(API_ENDPOINTS.tasks.start(id));
          const retryRes = await http.patch<any>(API_ENDPOINTS.tasks.submit(id), body);
          const raw = retryRes?.task || retryRes?.data?.task || retryRes;
          return mapTaskResponse(raw);
        } catch {
          // If retry fails, throw original error
        }
      }
      throw err;
    }
  },

  /**
   * Alias for submitTask matching existing codebase usages.
   */
  async submitTaskForReview(id: string, notes?: string): Promise<Task> {
    return this.submitTask(id, { notes: notes || "" });
  },

  /**
   * Admin reviews a submitted task (IN_REVIEW -> COMPLETED if approved or IN_PROGRESS if rejected).
   */
  async reviewTask(
    id: string,
    payloadOrIsApproved: ReviewTaskPayload | boolean,
    feedback?: string,
  ): Promise<Task> {
    const body: ReviewTaskPayload =
      typeof payloadOrIsApproved === "boolean"
        ? { isApproved: payloadOrIsApproved, feedback }
        : payloadOrIsApproved;

    const res = await http.patch<any>(API_ENDPOINTS.tasks.review(id), body);
    const raw = res?.task || res?.data?.task || res;
    return mapTaskResponse(raw);
  },

  /**
   * Admin fetches the Review Center overview with KPIs and pending review tasks.
   */
  async getReviewCenter(): Promise<ReviewCenterResponse> {
    const res = await http.get<any>(API_ENDPOINTS.tasks.reviewCenter);
    const rawList = res?.tasks || res?.data?.tasks || (Array.isArray(res) ? res : []);
    const tasks = Array.isArray(rawList) ? rawList.map(mapTaskResponse) : [];

    const kpis = res?.kpis || res?.data?.kpis || {
      pendingReview: tasks.length,
      highPriority: tasks.filter((t) => t.priority === "high").length,
      pointsAtStake: tasks.reduce((sum, t) => sum + (t.points || t.rewardPoints || 0), 0),
    };

    return { kpis, tasks };
  },

  /**
   * Employee fetches assigned tasks bucket (GET /tasks/assigned).
   */
  async getAssignedTasks(): Promise<Task[]> {
    const res = await http.get<any>(API_ENDPOINTS.tasks.assigned);
    const rawList = Array.isArray(res)
      ? res
      : res?.tasks || res?.data?.tasks || (res?.data && Array.isArray(res.data) ? res.data : []);

    if (Array.isArray(rawList)) {
      return rawList.map(mapTaskResponse);
    }
    return [];
  },

  /**
   * Employee fetches pending tasks bucket (GET /tasks/pending).
   */
  async getPendingTasks(): Promise<Task[]> {
    const res = await http.get<any>(API_ENDPOINTS.tasks.pending);
    const rawList = Array.isArray(res)
      ? res
      : res?.tasks || res?.data?.tasks || (res?.data && Array.isArray(res.data) ? res.data : []);

    if (Array.isArray(rawList)) {
      return rawList.map(mapTaskResponse);
    }
    return [];
  },

  /**
   * Employee fetches completed tasks bucket (GET /tasks/completed).
   */
  async getCompletedTasks(): Promise<Task[]> {
    const res = await http.get<any>(API_ENDPOINTS.tasks.completed);
    const rawList = Array.isArray(res)
      ? res
      : res?.tasks || res?.data?.tasks || (res?.data && Array.isArray(res.data) ? res.data : []);

    if (Array.isArray(rawList)) {
      return rawList.map(mapTaskResponse);
    }
    return [];
  },
};

// Aliases for direct functional imports
export const getAssignedTasks = tasksService.getAssignedTasks.bind(tasksService);
export const getPendingTasks = tasksService.getPendingTasks.bind(tasksService);
export const getCompletedTasks = tasksService.getCompletedTasks.bind(tasksService);
export const getReviewCenter = tasksService.getReviewCenter.bind(tasksService);
export const getTaskById = tasksService.getTaskById.bind(tasksService);
export const startTask = tasksService.startTask.bind(tasksService);
export const submitTask = tasksService.submitTask.bind(tasksService);
export const reviewTask = tasksService.reviewTask.bind(tasksService);
export const requestTask = tasksService.requestTask.bind(tasksService);
