/**
 * Tasks API Service Layer
 * Centralizes all communication with backend task endpoints.
 */

import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import {
  buildCreateTaskFormData,
  buildUpdateTaskFormData,
  mapTaskResponse,
  type CreateTaskInput,
  type RawTaskResponse,
  type Task,
  type TaskQueryFilters,
  type UpdateTaskInput,
} from "../types";

export const tasksService = {
  /**
   * Fetch all tasks (Smart endpoint: returns unmasked tasks for Admin/Director or masked for Employee).
   */
  async getTasks(filters?: TaskQueryFilters): Promise<Task[]> {
    const res = await http.get<{ tasks: RawTaskResponse[] }>(API_ENDPOINTS.tasks.list, {
      params: filters,
    });
    const list = res?.tasks || [];
    return list.map(mapTaskResponse);
  },

  /**
   * Fetch single task details by ID.
   */
  async getTaskById(id: string): Promise<Task> {
    const res = await http.get<{ task: RawTaskResponse }>(API_ENDPOINTS.tasks.detail(id));
    return mapTaskResponse(res.task);
  },

  /**
   * Admin creates a new task (Universal, Project, or Direct) with optional file attachments.
   */
  async createTask(input: CreateTaskInput | FormData): Promise<Task> {
    const body = input instanceof FormData ? input : buildCreateTaskFormData(input);
    const res = await http.post<{ task: RawTaskResponse }>(API_ENDPOINTS.tasks.create, body, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return mapTaskResponse(res.task);
  },

  /**
   * Admin updates a task and syncs Cloudinary attachments.
   */
  async updateTask(id: string, input: UpdateTaskInput | FormData): Promise<Task> {
    const body = input instanceof FormData ? input : buildUpdateTaskFormData(input);
    const res = await http.patch<{ task: RawTaskResponse }>(API_ENDPOINTS.tasks.update(id), body, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return mapTaskResponse(res.task);
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
    const res = await http.patch<{ task: RawTaskResponse }>(API_ENDPOINTS.tasks.assign(id), {
      employeeId,
    });
    return mapTaskResponse(res.task);
  },

  /**
   * Employee starts working on an assigned task (ASSIGNED -> IN_PROGRESS).
   */
  async startTask(id: string): Promise<Task> {
    const res = await http.patch<{ task: RawTaskResponse }>(API_ENDPOINTS.tasks.start(id));
    return mapTaskResponse(res.task);
  },

  /**
   * Employee submits an in-progress task for Admin review (IN_PROGRESS -> IN_REVIEW).
   */
  async submitTaskForReview(id: string, notes?: string): Promise<Task> {
    const res = await http.patch<{ task: RawTaskResponse }>(API_ENDPOINTS.tasks.submit(id), {
      notes,
    });
    return mapTaskResponse(res.task);
  },

  /**
   * Admin reviews a submitted task (IN_REVIEW -> COMPLETED if approved or IN_PROGRESS if rejected).
   */
  async reviewTask(id: string, isApproved: boolean, feedback?: string): Promise<Task> {
    const res = await http.patch<{ task: RawTaskResponse }>(API_ENDPOINTS.tasks.review(id), {
      isApproved,
      feedback,
    });
    return mapTaskResponse(res.task);
  },
};
