/**
 * Tasks Feature Types & Data Adapters
 * Bridges frontend Task models with backend Mongoose models.
 */

import type { TaskPriority as MockTaskPriority, TaskStatus as MockTaskStatus, TaskType as MockTaskType, TaskReviewState } from "@/lib/mock-data";

export type BackendTaskPriority = "Low" | "Medium" | "High" | "Urgent";
export type BackendTaskType = "Universal" | "Direct" | "Project";
export type BackendTaskStatus =
  | "Open"
  | "Requested"
  | "Assigned"
  | "In Progress"
  | "In Review"
  | "Completed"
  | "Cancelled";

export interface BackendPopulatedUser {
  _id: string;
  name: string;
  email: string;
  empId?: string;
  code?: string;
  designation?: unknown;
}

export interface BackendPopulatedProject {
  _id: string;
  name: string;
  code?: string;
  status?: string;
}

export interface BackendTaskRequest {
  employeeId: BackendPopulatedUser | string;
  requestedAt: string;
}

export interface BackendTask {
  _id: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  priority: BackendTaskPriority;
  type: BackendTaskType;
  status: BackendTaskStatus;
  projectId?: BackendPopulatedProject | string;
  assignedTo?: BackendPopulatedUser | string;
  requests?: BackendTaskRequest[];
  createdBy?: BackendPopulatedUser | string;
  notes?: string;
  estimatedTime?: string;
  rewardPoints: number;
  deadline?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BackendMaskedTask {
  task: Partial<BackendTask>;
  isRequestedByMe?: boolean;
}

export type RawTaskResponse = BackendTask | BackendMaskedTask;

/**
 * Normalized Frontend Task Model
 */
export interface Task {
  _id: string;
  id: string;
  title: string;
  description: string;
  category: string;
  priority: MockTaskPriority;
  status: MockTaskStatus;
  taskType?: MockTaskType;
  points: number;
  dueDate: string;
  createdAt: string;
  updatedAt?: string;
  assignee: string;
  assigneeId: string;
  assigneeCode?: string;
  assignedAt?: string;
  createdBy?: string;
  creatorId?: string;
  notes?: string;
  attachments?: { name: string; size: string; url?: string }[];
  rawAttachmentUrls?: string[];
  reviewState?: TaskReviewState;
  rejectionReason?: string;
  projectId?: string;
  projectName?: string;
  projectCode?: string;
  estimatedTime?: string;
  isRequestedByMe?: boolean;
  requestsCount?: number;
  requests?: Array<{ employeeId: string; employeeName?: string; employeeCode?: string; requestedAt: string }>;
}

export interface TaskQueryFilters {
  projectId?: string;
  status?: string;
  priority?: string;
  type?: string;
  assignedTo?: string;
  [key: string]: unknown;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  category: string;
  priority: MockTaskPriority | BackendTaskPriority;
  taskType: MockTaskType | BackendTaskType;
  projectId?: string;
  assigneeId?: string;
  points: number;
  dueDate: string;
  notes?: string;
  estimatedTime?: string;
  attachments?: File[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  category?: string;
  priority?: MockTaskPriority | BackendTaskPriority;
  taskType?: MockTaskType | BackendTaskType;
  projectId?: string;
  assigneeId?: string;
  points?: number;
  dueDate?: string;
  notes?: string;
  estimatedTime?: string;
  status?: BackendTaskStatus | MockTaskStatus;
  existingAttachments?: string[];
  attachments?: File[];
}

export interface AssignTaskPayload {
  employeeId: string;
}

export interface SubmitTaskPayload {
  notes?: string;
}

export interface ReviewTaskPayload {
  isApproved: boolean;
  feedback?: string;
}

/* -------------------------------- Adapters -------------------------------- */

export function toBackendTaskPriority(priority?: string): BackendTaskPriority {
  switch ((priority || "").toLowerCase()) {
    case "low":
      return "Low";
    case "high":
    case "urgent":
      return "High";
    case "medium":
    default:
      return "Medium";
  }
}

export function toFrontendTaskPriority(priority?: string): MockTaskPriority {
  switch ((priority || "").toLowerCase()) {
    case "low":
      return "low";
    case "high":
    case "urgent":
      return "high";
    case "medium":
    default:
      return "medium";
  }
}

export function toBackendTaskType(type?: string): BackendTaskType {
  switch ((type || "").toLowerCase()) {
    case "universal":
      return "Universal";
    case "project":
      return "Project";
    case "direct":
    default:
      return "Direct";
  }
}

export function toFrontendTaskType(type?: string): MockTaskType {
  switch ((type || "").toLowerCase()) {
    case "universal":
      return "universal";
    case "project":
      return "project";
    case "direct":
    default:
      return "direct";
  }
}

export function toFrontendTaskStatus(status?: string): { status: MockTaskStatus; reviewState?: TaskReviewState } {
  switch (status) {
    case "Open":
      return { status: "available" };
    case "Requested":
      return { status: "pending" };
    case "Assigned":
      return { status: "assigned" };
    case "In Progress":
      return { status: "in_progress" };
    case "In Review":
      return { status: "in_progress", reviewState: "in_review" };
    case "Completed":
      return { status: "completed", reviewState: "approved" };
    case "Cancelled":
      return { status: "overdue" };
    default:
      return { status: "pending" };
  }
}

/**
 * Normalizes any backend task response (ITask or IMaskedTask) into frontend Task format.
 */
export function mapTaskResponse(raw: RawTaskResponse): Task {
  let doc: Partial<BackendTask>;
  let isRequestedByMe = false;

  if ("task" in raw && raw.task) {
    doc = raw.task;
    isRequestedByMe = Boolean(raw.isRequestedByMe);
  } else {
    doc = raw as Partial<BackendTask>;
  }

  const id = doc._id || doc.id || "";
  const { status: frontendStatus, reviewState: defaultReviewState } = toFrontendTaskStatus(doc.status);

  // Parse project info
  let projectId: string | undefined;
  let projectName: string | undefined;
  let projectCode: string | undefined;
  if (doc.projectId) {
    if (typeof doc.projectId === "object") {
      projectId = doc.projectId._id;
      projectName = doc.projectId.name;
      projectCode = doc.projectId.code;
    } else {
      projectId = String(doc.projectId);
    }
  }

  // Parse assignee info
  let assigneeId = "";
  let assignee = "";
  let assigneeCode: string | undefined;
  if (doc.assignedTo) {
    if (typeof doc.assignedTo === "object") {
      assigneeId = doc.assignedTo._id;
      assignee = doc.assignedTo.name || "";
      assigneeCode = doc.assignedTo.code || doc.assignedTo.empId;
    } else {
      assigneeId = String(doc.assignedTo);
    }
  }

  // Parse creator info
  let creatorId = "";
  let createdBy = "";
  if (doc.createdBy) {
    if (typeof doc.createdBy === "object") {
      creatorId = doc.createdBy._id;
      createdBy = doc.createdBy.name || "";
    } else {
      creatorId = String(doc.createdBy);
    }
  }

  // Parse requests
  const requests = (doc.requests || []).map((req) => {
    if (typeof req.employeeId === "object" && req.employeeId) {
      return {
        employeeId: req.employeeId._id,
        employeeName: req.employeeId.name,
        employeeCode: req.employeeId.code || req.employeeId.empId,
        requestedAt: req.requestedAt,
      };
    }
    return {
      employeeId: String(req.employeeId || ""),
      requestedAt: req.requestedAt,
    };
  });

  // Parse rejection / feedback from notes if available
  let rejectionReason: string | undefined;
  if (doc.notes && doc.notes.includes("Admin Feedback:")) {
    const parts = doc.notes.split("Admin Feedback:");
    rejectionReason = parts[parts.length - 1]?.trim();
  }

  // Parse attachments
  const rawAttachments = doc.attachments || [];
  const attachments = rawAttachments.map((url) => {
    const filename = url.split("/").pop() || "attachment";
    return {
      name: decodeURIComponent(filename),
      size: "File",
      url,
    };
  });

  const dueDate = doc.deadline
    ? new Date(doc.deadline).toISOString().slice(0, 10)
    : doc.createdAt
      ? new Date(doc.createdAt).toISOString().slice(0, 10)
      : "";

  return {
    _id: id,
    id,
    title: doc.title || "",
    description: doc.description || "",
    category: doc.category || "General",
    priority: toFrontendTaskPriority(doc.priority),
    status: frontendStatus,
    taskType: toFrontendTaskType(doc.type),
    points: Number(doc.rewardPoints ?? 0),
    dueDate,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString().slice(0, 10) : "",
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
    assignee,
    assigneeId,
    assigneeCode,
    createdBy,
    creatorId,
    notes: doc.notes,
    attachments,
    rawAttachmentUrls: rawAttachments,
    reviewState: defaultReviewState,
    rejectionReason,
    projectId,
    projectName,
    projectCode,
    estimatedTime: doc.estimatedTime,
    isRequestedByMe,
    requestsCount: requests.length,
    requests,
  };
}

/**
 * Builds FormData for multipart/form-data task creation.
 */
export function buildCreateTaskFormData(input: CreateTaskInput): FormData {
  const fd = new FormData();
  fd.append("title", input.title.trim());
  fd.append("description", input.description.trim());
  fd.append("category", input.category.trim());
  fd.append("priority", toBackendTaskPriority(input.priority));
  fd.append("type", toBackendTaskType(input.taskType));
  fd.append("rewardPoints", String(input.points || 0));

  if (input.dueDate) {
    fd.append("deadline", new Date(input.dueDate).toISOString());
  }
  if (input.notes) {
    fd.append("notes", input.notes.trim());
  }
  if (input.estimatedTime) {
    fd.append("estimatedTime", input.estimatedTime.trim());
  }
  if (input.taskType === "project" && input.projectId) {
    fd.append("projectId", input.projectId);
  }
  if (input.taskType === "direct" && input.assigneeId) {
    fd.append("assignedTo", input.assigneeId);
  }

  if (input.attachments && input.attachments.length > 0) {
    for (const file of input.attachments) {
      if (file instanceof File) {
        fd.append("attachments", file);
      }
    }
  }

  return fd;
}

/**
 * Builds FormData for multipart/form-data task update.
 */
export function buildUpdateTaskFormData(input: UpdateTaskInput): FormData {
  const fd = new FormData();
  if (input.title !== undefined) fd.append("title", input.title.trim());
  if (input.description !== undefined) fd.append("description", input.description.trim());
  if (input.category !== undefined) fd.append("category", input.category.trim());
  if (input.priority !== undefined) fd.append("priority", toBackendTaskPriority(input.priority));
  if (input.taskType !== undefined) fd.append("type", toBackendTaskType(input.taskType));
  if (input.points !== undefined) fd.append("rewardPoints", String(input.points));
  if (input.dueDate !== undefined) fd.append("deadline", input.dueDate ? new Date(input.dueDate).toISOString() : "");
  if (input.notes !== undefined) fd.append("notes", input.notes.trim());
  if (input.estimatedTime !== undefined) fd.append("estimatedTime", input.estimatedTime.trim());
  if (input.projectId !== undefined) fd.append("projectId", input.projectId);
  if (input.assigneeId !== undefined) fd.append("assignedTo", input.assigneeId);

  if (input.existingAttachments) {
    fd.append("existingAttachments", JSON.stringify(input.existingAttachments));
  }

  if (input.attachments && input.attachments.length > 0) {
    for (const file of input.attachments) {
      if (file instanceof File) {
        fd.append("attachments", file);
      }
    }
  }

  return fd;
}
