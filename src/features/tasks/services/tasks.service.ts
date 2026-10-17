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
  toBackendTaskPriority,
  toBackendTaskType,
  type CreateTaskInput,
  type ReviewCenterResponse,
  type ReviewTaskPayload,
  type SubmitTaskPayload,
  type Task,
  type TaskQueryFilters,
  type TasksResult,
  type UpdateTaskInput,
} from "../types";

/**
 * Filter sanitizer for Task API requests.
 * Guarantees that 'page' is always present in query parameters (defaults to 1).
 */
function cleanTaskFilters(filters?: TaskQueryFilters): Record<string, unknown> {
  const page =
    filters?.page !== undefined && filters?.page !== null && !isNaN(Number(filters.page))
      ? Math.max(1, Number(filters.page))
      : 1;

  const cleaned: Record<string, unknown> = {
    page,
  };

  if (filters?.limit !== undefined && filters?.limit !== null && !isNaN(Number(filters.limit))) {
    cleaned.limit = Math.max(1, Number(filters.limit));
  }

  if (filters?.projectId && typeof filters.projectId === "string") {
    cleaned.projectId = filters.projectId;
  }

  if (filters?.status && typeof filters.status === "string" && filters.status !== "all") {
    cleaned.status = filters.status;
  }

  if (filters?.priority && typeof filters.priority === "string" && filters.priority !== "all") {
    cleaned.priority = filters.priority;
  }

  if (filters?.type && typeof filters.type === "string" && filters.type !== "all") {
    cleaned.type = filters.type;
  }

  if (filters?.assignedTo && typeof filters.assignedTo === "string") {
    cleaned.assignedTo = filters.assignedTo;
  }

  if (filters) {
    for (const [key, val] of Object.entries(filters)) {
      if (!(key in cleaned) && val !== undefined && val !== null && val !== "" && val !== "all") {
        cleaned[key] = val;
      }
    }
  }

  return cleaned;
}

export const tasksService = {
  /**
   * Fetch all tasks (Smart endpoint: returns unmasked tasks for Admin/Director or masked for Employee).
   * Always includes page parameter in query (e.g. /tasks?page=1 or /tasks?page=N).
   */
  async getTasks(filters?: TaskQueryFilters): Promise<TasksResult> {
    const params = cleanTaskFilters(filters);
    const res = await http.get<any>(API_ENDPOINTS.tasks.list, {
      params,
    });
    const rawList = Array.isArray(res)
      ? res
      : res?.tasks || res?.data?.tasks || (res?.data && Array.isArray(res.data) ? res.data : []);

    const tasks: TasksResult = (Array.isArray(rawList) ? rawList : []).map(mapTaskResponse);

    const rawPagination = res?.pagination || res?.data?.pagination || res?.meta;
    if (rawPagination) {
      tasks.pagination = {
        totalRecords: Number(
          rawPagination.totalRecords ||
            rawPagination.total ||
            rawPagination.totalItems ||
            rawPagination.count ||
            tasks.length,
        ),
        currentPage: Number(rawPagination.currentPage || rawPagination.page || params.page || 1),
        totalPages: Number(
          rawPagination.totalPages ||
            rawPagination.pages ||
            Math.max(
              1,
              Math.ceil((rawPagination.totalRecords || tasks.length) / (Number(params.limit) || 8)),
            ),
        ),
        limit: Number(rawPagination.limit || rawPagination.perPage || params.limit || 8),
        hasNextPage: Boolean(rawPagination.hasNextPage ?? rawPagination.hasNext),
        hasPrevPage: Boolean(rawPagination.hasPrevPage ?? rawPagination.hasPrev),
      };
    } else if (
      res?.totalPages !== undefined ||
      res?.total !== undefined ||
      res?.totalRecords !== undefined
    ) {
      const total = Number(res?.totalRecords ?? res?.total ?? tasks.length);
      const limit = Number(res?.limit ?? params.limit ?? 8);
      const totalPages = Number(
        res?.totalPages ?? res?.pages ?? Math.max(1, Math.ceil(total / limit)),
      );
      tasks.pagination = {
        totalRecords: total,
        currentPage: Number(res?.currentPage ?? res?.page ?? params.page ?? 1),
        totalPages,
        limit,
        hasNextPage: Number(params.page) < totalPages,
        hasPrevPage: Number(params.page) > 1,
      };
    }

    return tasks;
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
   * Admin creates a new task (Universal, Project, or Direct).
   * Supports both client-uploaded CDN attachments (v2) and standard multipart FormData (v1).
   */
  async createTask(input: CreateTaskInput | FormData): Promise<Task> {
    if (input instanceof FormData) {
      const res = await http.post<any>(API_ENDPOINTS.tasks.create, input);
      const raw = res?.task || res?.data?.task || res;
      return mapTaskResponse(raw);
    }

    // Direct JSON payload for tasks created with client-side uploaded attachments
    const jsonBody: Record<string, unknown> = {
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category.trim(),
      priority: toBackendTaskPriority(input.priority),
      type: toBackendTaskType(input.taskType),
      rewardPoints: input.points || 0,
      deadline: input.dueDate ? new Date(input.dueDate).toISOString() : undefined,
      notes: input.notes?.trim() || undefined,
      estimatedTime: input.estimatedTime?.trim() || undefined,
      projectId: input.taskType === "project" ? input.projectId : undefined,
      assignedTo: input.taskType === "direct" ? input.assigneeId : undefined,
      attachments: (input.uploadedAttachments || []).map((att) => ({
        url: att.url,
        publicId: att.publicId,
        name: att.name,
        size: att.size,
      })),
    };

    try {
      const res = await http.post<any>(API_ENDPOINTS.tasks.createV2, jsonBody);
      const raw = res?.task || res?.data?.task || res;
      return mapTaskResponse(raw);
    } catch (v2Err: any) {
      // Graceful fallback to v1 multipart if v2 is not supported in environment
      if (v2Err?.status === 404 || v2Err?.response?.status === 404) {
        const body = buildCreateTaskFormData(input);
        const res = await http.post<any>(API_ENDPOINTS.tasks.create, body);
        const raw = res?.task || res?.data?.task || res;
        return mapTaskResponse(raw);
      }
      throw v2Err;
    }
  },

  /**
   * Admin updates a task and syncs Cloudinary attachments.
   * Supports both client-uploaded CDN attachments (v2) and standard multipart FormData (v1).
   */
  async updateTask(id: string, input: UpdateTaskInput | FormData): Promise<Task> {
    if (input instanceof FormData) {
      const res = await http.patch<any>(API_ENDPOINTS.tasks.update(id), input);
      const raw = res?.task || res?.data?.task || res;
      return mapTaskResponse(raw);
    }

    const jsonBody: Record<string, unknown> = {};
    if (input.title !== undefined) jsonBody.title = input.title.trim();
    if (input.description !== undefined) jsonBody.description = input.description.trim();
    if (input.category !== undefined) jsonBody.category = input.category.trim();
    if (input.priority !== undefined) jsonBody.priority = toBackendTaskPriority(input.priority);
    if (input.taskType !== undefined) jsonBody.type = toBackendTaskType(input.taskType);
    if (input.points !== undefined) jsonBody.rewardPoints = input.points;
    if (input.dueDate !== undefined)
      jsonBody.deadline = input.dueDate ? new Date(input.dueDate).toISOString() : "";
    if (input.notes !== undefined) jsonBody.notes = input.notes.trim();
    if (input.estimatedTime !== undefined) jsonBody.estimatedTime = input.estimatedTime.trim();
    if (input.projectId !== undefined) jsonBody.projectId = input.projectId;
    if (input.assigneeId !== undefined) jsonBody.assignedTo = input.assigneeId;

    if (input.uploadedAttachments !== undefined) {
      jsonBody.attachments = input.uploadedAttachments.map((att) => ({
        url: att.url,
        publicId: att.publicId,
        name: att.name,
        size: att.size,
      }));
    }

    try {
      const res = await http.patch<any>(API_ENDPOINTS.tasks.updateV2(id), jsonBody);
      const raw = res?.task || res?.data?.task || res;
      return mapTaskResponse(raw);
    } catch (v2Err: any) {
      if (v2Err?.status === 404 || v2Err?.response?.status === 404) {
        const body = buildUpdateTaskFormData(input);
        const res = await http.patch<any>(API_ENDPOINTS.tasks.update(id), body);
        const raw = res?.task || res?.data?.task || res;
        return mapTaskResponse(raw);
      }
      throw v2Err;
    }
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
   * Supports proof URL & publicId for direct-to-CDN proof uploads.
   */
  async submitTask(
    id: string,
    payload:
      | SubmitTaskPayload
      | {
          notes?: string;
          proof?: { url: string; publicId: string };
          proofUrl?: string;
          proofPublicId?: string;
          files?: File[];
        }
      | FormData
      | string,
  ): Promise<Task> {
    const body =
      typeof payload === "string"
        ? { notes: payload }
        : payload instanceof FormData
          ? payload
          : { ...payload };
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
  async submitTaskForReview(
    id: string,
    notesOrPayload?: string | SubmitTaskPayload | FormData,
  ): Promise<Task> {
    if (typeof notesOrPayload === "string" || !notesOrPayload) {
      return this.submitTask(id, { notes: notesOrPayload || "" });
    }
    return this.submitTask(id, notesOrPayload);
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
    const allTasks = Array.isArray(rawList) ? rawList.map(mapTaskResponse) : [];

    // Filter strictly to tasks waiting for review (exclude completed, approved, rejected, or active in-progress tasks)
    const tasks = allTasks.filter((t) => {
      const raw = (t.rawStatus || "").toLowerCase().trim();
      const st = (t.status || "").toLowerCase().trim();
      const rev = (t.reviewState || "").toLowerCase().trim();
      if (raw === "completed" || st === "completed" || rev === "approved") return false;
      if (rev === "rejected" || Boolean(t.rejectionReason)) return false;
      if (raw === "in_progress" && rev !== "in_review") return false;
      return raw === "in_review" || rev === "in_review" || st === "in_review";
    });

    const calculatedPoints = tasks.reduce((sum, t) => sum + (t.points || t.rewardPoints || 0), 0);
    const backendPoints =
      typeof res?.kpis?.pointsAtStake === "number" ? res.kpis.pointsAtStake : undefined;

    const kpis = {
      pendingReview:
        typeof res?.kpis?.pendingReview === "number" ? res.kpis.pendingReview : tasks.length,
      highPriority:
        typeof res?.kpis?.highPriority === "number"
          ? res.kpis.highPriority
          : tasks.filter((t) => t.priority === "high").length,
      pointsAtStake:
        backendPoints !== undefined && backendPoints > 0 ? backendPoints : calculatedPoints,
    };

    return { kpis, tasks };
  },

  /**
   * Employee fetches assigned tasks bucket (GET /tasks/assigned).
   */
  async getAssignedTasks(filters?: TaskQueryFilters): Promise<Task[]> {
    const params = filters?.page !== undefined ? cleanTaskFilters(filters) : filters;
    const res = await http.get<any>(API_ENDPOINTS.tasks.assigned, { params });
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
  async getPendingTasks(filters?: TaskQueryFilters): Promise<Task[]> {
    const params = filters?.page !== undefined ? cleanTaskFilters(filters) : filters;
    const res = await http.get<any>(API_ENDPOINTS.tasks.pending, { params });
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
  async getCompletedTasks(filters?: TaskQueryFilters): Promise<Task[]> {
    const params = filters?.page !== undefined ? cleanTaskFilters(filters) : filters;
    const res = await http.get<any>(API_ENDPOINTS.tasks.completed, { params });
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
