/**
 * Tasks Feature Types & Data Adapters
 * Bridges frontend Task models with backend Mongoose models.
 */

import type {
  TaskPriority as MockTaskPriority,
  TaskStatus as MockTaskStatus,
  TaskType as MockTaskType,
  TaskReviewState,
} from "@/lib/mock-data";
import { extractCloudinaryPublicId } from "@/lib/cdn-upload";

export type TaskPriority = MockTaskPriority;
export type TaskStatus = MockTaskStatus;
export type TaskType = MockTaskType;

export type BackendTaskPriority = "low" | "medium" | "high" | "urgent" | "Low" | "Medium" | "High" | "Urgent";
export type BackendTaskType = "universal" | "direct" | "project" | "Universal" | "Direct" | "Project";
export type BackendTaskStatus =
  | "Open"
  | "Requested"
  | "Assigned"
  | "In Progress"
  | "In Review"
  | "Completed"
  | "Cancelled"
  | "open"
  | "requested"
  | "assigned"
  | "in_progress"
  | "in_review"
  | "completed"
  | "cancelled"
  | "overdue"
  | "rejected";

export interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
  empId?: string;
  code?: string;
  designation?: unknown;
}

export type BackendPopulatedUser = PopulatedUser;

export interface BackendPopulatedProject {
  _id: string;
  name: string;
  code?: string;
  status?: string;
}

export interface BackendTaskRequest {
  employeeId: PopulatedUser | string;
  requestedAt: string;
}

export interface TaskProofFile {
  name: string;
  url: string;
  size?: number | string;
  publicId?: string;
  mimeType?: string;
  dataUrl?: string;
  uploadedAt?: string;
}

export interface TaskReviewFeedback {
  _id?: string;
  reviewerId?: string;
  reviewerName: string;
  reviewerEmail?: string;
  employeeId?: string;
  feedback: string;
  status: "approved" | "rejected";
  reviewedAt: string;
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
  assignedTo?: PopulatedUser | string;
  requests?: BackendTaskRequest[];
  createdBy?: PopulatedUser | string;
  submittedBy?: PopulatedUser | string;
  submittedAt?: string;
  proofFiles?: Array<string | {
    url: string;
    publicId?: string;
    name?: string;
    size?: number | string;
    mimeType?: string;
    uploadedAt?: string;
  }>;
  reviews?: Array<{
    _id?: string;
    reviewerId?: PopulatedUser | string;
    reviewerName?: string;
    reviewerEmail?: string;
    employeeId?: PopulatedUser | string;
    feedback: string;
    status: "approved" | "rejected";
    reviewedAt: string;
  }>;
  feedback?: string;
  reviewedBy?: PopulatedUser | string;
  reviewedAt?: string;
  reviewStatus?: "approved" | "rejected";
  notes?: string;
  estimatedTime?: string;
  rewardPoints: number;
  deadline?: string;
  dueDate?: string;
  attachments?: string[] | { publicId?: string; url?: string; name?: string; size?: number | string }[];
  createdAt: string;
  updatedAt: string;
}

export interface BackendMaskedTask {
  task: Partial<BackendTask>;
  isRequestedByMe?: boolean;
}

export type RawTaskResponse = BackendTask | BackendMaskedTask;

export interface TaskAttachmentItem {
  name: string;
  size: string;
  url?: string;
  publicId?: string;
}

/**
 * Standard Normalized Task Interface
 */
export interface Task {
  _id: string;
  id: string;
  title: string;
  description: string;
  priority: MockTaskPriority;
  status: MockTaskStatus;
  dueDate: string;
  deadline?: string;
  rewardPoints?: number;
  points: number;
  assignedTo?: PopulatedUser | string;
  assignee: string;
  assigneeId: string;
  assigneeCode?: string;
  assigneeEmail?: string;
  assignedAt?: string;
  createdBy?: string;
  creatorId?: string;
  creatorUser?: PopulatedUser;
  submittedBy?: string;
  submittedById?: string;
  submittedByUser?: PopulatedUser;
  submittedAt?: string;
  feedback?: string;
  isFeedbackTemporary?: boolean;
  reviewedBy?: string;
  reviewedById?: string;
  reviewedByUser?: PopulatedUser;
  reviewedAt?: string;
  reviewStatus?: "approved" | "rejected";
  reviews?: TaskReviewFeedback[];
  notes?: string;
  projectId?: string;
  projectName?: string;
  projectCode?: string;
  category: string;
  taskType?: MockTaskType;
  estimatedTime?: string;
  attachments?: TaskAttachmentItem[];
  rawAttachmentUrls?: string[];
  proofFiles?: TaskProofFile[];
  reviewState?: TaskReviewState;
  rejectionReason?: string;
  rawStatus?: BackendTaskStatus;
  isRequestedByMe?: boolean;
  requestsCount?: number;
  requests?: Array<{
    _id?: string;
    employeeId: BackendPopulatedUser | string;
    employeeName?: string;
    employeeCode?: string;
    employeeEmail?: string;
    requestedAt: string;
    status?: string;
  }>;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Review Center Response structure returned by GET /tasks/review-center
 */
export interface ReviewCenterResponse {
  kpis: {
    pendingReview: number;
    highPriority: number;
    pointsAtStake: number;
  };
  tasks: Task[];
}

export interface TaskPagination {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export type TasksResult = Task[] & { pagination?: TaskPagination };

export interface TaskQueryFilters {
  page?: number;
  limit?: number;
  projectId?: string;
  status?: string;
  priority?: string;
  type?: string;
  assignedTo?: string;
  [key: string]: unknown;
}

export interface TaskUploadedAttachment {
  url: string;
  publicId: string;
  name?: string;
  size?: string;
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
  uploadedAttachments?: TaskUploadedAttachment[];
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
  uploadedAttachments?: TaskUploadedAttachment[];
}

export interface AssignTaskPayload {
  employeeId: string;
}

export interface SubmitTaskPayload {
  notes: string;
  proof?: {
    url: string;
    publicId: string;
  };
  proofUrl?: string;
  proofPublicId?: string;
}

export interface ReviewTaskPayload {
  isApproved: boolean;
  feedback?: string;
}

/* -------------------------------- Adapters -------------------------------- */

export function toBackendTaskPriority(priority?: string): BackendTaskPriority {
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
      return "universal";
    case "project":
      return "project";
    case "direct":
    default:
      return "direct";
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
  const normalized = (status || "").toLowerCase().trim().replace(/[\s_-]+/g, "_");
  switch (normalized) {
    case "open":
    case "available":
      return { status: "available" };
    case "requested":
      return { status: "pending" };
    case "assigned":
      return { status: "assigned" };
    case "in_progress":
      return { status: "in_progress" };
    case "in_review":
    case "pending_review":
    case "review":
      return { status: "in_review", reviewState: "in_review" };
    case "completed":
    case "approved":
      return { status: "completed", reviewState: "approved" };
    case "rejected":
      return { status: "rejected", reviewState: "rejected" };
    case "cancelled":
    case "overdue":
      return { status: "overdue" };
    default:
      return { status: "pending" };
  }
}

/**
 * Determines whether a task is overdue based on status and deadline/dueDate.
 */
export function isTaskOverdue(task?: {
  dueDate?: string;
  deadline?: string;
  status?: string;
  rawStatus?: string;
} | null): boolean {
  if (!task) return false;

  const normStatus = (task.status || "").toLowerCase().trim();
  const rawStatus = (task.rawStatus || "").toLowerCase().trim();

  if (normStatus === "overdue" || rawStatus === "overdue") {
    return true;
  }

  if (task.dueDate) {
    const days = Math.ceil((+new Date(task.dueDate) - Date.now()) / 86400000);
    if (!isNaN(days) && days < 0) {
      return true;
    }
  }

  if (task.deadline) {
    const deadlineTime = new Date(task.deadline).getTime();
    if (!isNaN(deadlineTime) && deadlineTime < Date.now()) {
      return true;
    }
  }

  return false;
}

/**
 * Determines whether a task is eligible for submission.
 * Rule: Do not treat completed, already-submitted, or currently-in-review tasks
 * as eligible for submission unless existing business rules allow it.
 */
export function isTaskEligibleForSubmission(task?: {
  status?: string;
  rawStatus?: string;
  reviewState?: string;
  reviewStatus?: string;
} | null): boolean {
  if (!task) return false;

  const normStatus = (task.status || "").toLowerCase().trim();
  const rawStatus = (task.rawStatus || "").toLowerCase().trim();
  const revState = (task.reviewState || "").toLowerCase().trim();
  const revStatus = (task.reviewStatus || "").toLowerCase().trim();

  // Completed tasks are NOT eligible for submission
  if (
    normStatus === "completed" ||
    rawStatus === "completed" ||
    revState === "approved" ||
    revStatus === "approved"
  ) {
    return false;
  }

  // Already submitted / currently in review tasks are NOT eligible
  if (
    normStatus === "in_review" ||
    normStatus === "in review" ||
    normStatus === "pending_review" ||
    rawStatus === "in_review" ||
    rawStatus === "in review" ||
    revState === "in_review" ||
    revState === "pending_review" ||
    revStatus === "in_review"
  ) {
    return false;
  }

  // Cancelled tasks are NOT eligible
  if (normStatus === "cancelled" || rawStatus === "cancelled") {
    return false;
  }

  return true;
}

export function isMongoObjectId(val: unknown): boolean {
  return typeof val === "string" && /^[a-f\d]{24}$/i.test(val.trim());
}

/**
 * Returns a human-readable category label.
 * Never returns a raw MongoDB ObjectId.
 * Falls back to "Uncategorized" if category is missing or invalid.
 */
export function getCategoryLabel(category: unknown): string {
  if (typeof category === "string") {
    const value = category.trim();

    // Do not display a raw MongoDB ObjectId.
    if (isMongoObjectId(value)) {
      return "Uncategorized";
    }

    return value || "Uncategorized";
  }

  if (category && typeof category === "object") {
    const value = category as {
      name?: unknown;
      title?: unknown;
      label?: unknown;
      categoryName?: unknown;
    };

    for (const candidate of [
      value.name,
      value.title,
      value.label,
      value.categoryName,
    ]) {
      if (
        typeof candidate === "string" &&
        candidate.trim() &&
        !isMongoObjectId(candidate.trim())
      ) {
        return candidate.trim();
      }
    }
  }

  return "Uncategorized";
}

/**
 * Resolves a human-readable category name from an API task document.
 * Checks candidate fields and populated objects while preventing raw ObjectId display.
 */
export function resolveTaskCategory(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "Uncategorized";
  const d = doc as Record<string, unknown>;

  const candidates = [
    d.category,
    d.categoryName,
    d.category_name,
    d.categoryTitle,
    d.categoryLabel,
    typeof d.category === "object" && d.category !== null ? (d.category as Record<string, unknown>).name : undefined,
    typeof d.category === "object" && d.category !== null ? (d.category as Record<string, unknown>).title : undefined,
    typeof d.category === "object" && d.category !== null ? (d.category as Record<string, unknown>).label : undefined,
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null) {
      const label = getCategoryLabel(candidate);
      if (label !== "Uncategorized") {
        return label;
      }
    }
  }

  return "Uncategorized";
}

/**
 * Formats the task subtitle for display.
 * Never displays a raw MongoDB ObjectId.
 */
export function formatTaskSubtitle(category: unknown, id?: string): string {
  const catLabel = getCategoryLabel(category);
  if (id && typeof id === "string" && id.trim() && !isMongoObjectId(id.trim())) {
    return `${catLabel} · ${id.trim()}`;
  }
  return catLabel;
}

/**
 * Normalizes any backend task response (ITask or IMaskedTask) into frontend Task format.
 */
export function mapTaskResponse(raw: RawTaskResponse | any): Task {
  if (!raw) {
    return {
      _id: "",
      id: "",
      title: "",
      description: "",
      category: "General",
      priority: "medium",
      status: "assigned",
      points: 0,
      dueDate: "",
      createdAt: "",
      updatedAt: "",
      assignee: "",
      assigneeId: "",
    };
  }

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
  let assigneeEmail: string | undefined;
  if (doc.assignedTo) {
    if (typeof doc.assignedTo === "object") {
      assigneeId = doc.assignedTo._id;
      assignee = doc.assignedTo.name || "";
      assigneeEmail = doc.assignedTo.email;
      assigneeCode = doc.assignedTo.code || doc.assignedTo.empId;
    } else {
      assigneeId = String(doc.assignedTo);
    }
  }

  // Parse creator info
  let creatorId = "";
  let createdBy = "";
  let creatorUser: PopulatedUser | undefined;
  if (doc.createdBy) {
    if (typeof doc.createdBy === "object") {
      creatorUser = doc.createdBy;
      creatorId = doc.createdBy._id;
      createdBy = doc.createdBy.name || "";
    } else {
      creatorId = String(doc.createdBy);
      createdBy = String(doc.createdBy);
    }
  }

  // Parse requests
  const requests = (doc.requests || []).map((req: any) => {
    const isPopulated = typeof req.employeeId === "object" && req.employeeId !== null;
    return {
      _id: req._id ? String(req._id) : undefined,
      employeeId: req.employeeId,
      employeeName: isPopulated ? req.employeeId.name : undefined,
      employeeCode: isPopulated ? (req.employeeId.code || req.employeeId.empId) : undefined,
      employeeEmail: isPopulated ? req.employeeId.email : undefined,
      requestedAt: req.requestedAt,
      status: req.status,
    };
  });

  // Parse rejection / feedback from notes if available
  let rejectionReason: string | undefined;
  if (doc.notes && doc.notes.includes("Admin Feedback:")) {
    const parts = doc.notes.split("Admin Feedback:");
    rejectionReason = parts[parts.length - 1]?.trim();
  }

  // Parse attachments
  const rawAttachments = Array.isArray(doc.attachments) ? doc.attachments : [];
  const rawAttachmentUrls: string[] = [];

  const attachments: TaskAttachmentItem[] = rawAttachments
    .map((item: any): TaskAttachmentItem | null => {
      if (!item) return null;

      let fileUrl = "";
      let fileName = "attachment";

      if (typeof item === "string") {
        fileUrl = item;
      } else if (typeof item === "object" && item !== null) {
        fileUrl = item.url || item.path || item.secure_url || item.link || "";
        if (item.name || item.filename || item.originalName) {
          fileName = String(item.name || item.filename || item.originalName);
        }
      }

      if (!fileUrl || typeof fileUrl !== "string") return null;

      rawAttachmentUrls.push(fileUrl);

      if (fileName === "attachment") {
        try {
          const parts = fileUrl.split("/");
          const lastPart = parts[parts.length - 1];
          if (lastPart) {
            fileName = decodeURIComponent(lastPart.split("?")[0]);
          }
        } catch {
          fileName = "attachment";
        }
      }

      const publicId =
        typeof item === "object" && item !== null && item.publicId
          ? String(item.publicId)
          : extractCloudinaryPublicId(fileUrl);

      return {
        name: fileName,
        size: item?.size ? (typeof item.size === "number" ? `${Math.round(item.size / 1024)} KB` : String(item.size)) : "File",
        url: fileUrl,
        publicId: publicId || undefined,
      };
    })
    .filter((att): att is TaskAttachmentItem => att !== null);

  // Parse submittedBy info
  let submittedById = "";
  let submittedBy = "";
  let submittedByUser: PopulatedUser | undefined;
  let submittedAt = doc.submittedAt;
  if (doc.submittedBy) {
    if (typeof doc.submittedBy === "object") {
      submittedByUser = doc.submittedBy;
      submittedById = doc.submittedBy._id;
      submittedBy = doc.submittedBy.name || "";
    } else {
      submittedById = String(doc.submittedBy);
      submittedBy = String(doc.submittedBy);
    }
  }

  // Parse proof files
  const rawProofFiles = Array.isArray(doc.proofFiles) ? doc.proofFiles : [];
  const proofFiles: TaskProofFile[] = [];

  for (const item of rawProofFiles) {
    if (!item) continue;
    if (typeof item === "string") {
      let fileName = "Proof File";
      try {
        const parts = item.split("/");
        const lastPart = parts[parts.length - 1];
        if (lastPart) fileName = decodeURIComponent(lastPart.split("?")[0]);
      } catch {}
      proofFiles.push({
        url: item,
        name: fileName,
        size: "File",
      });
    } else if (typeof item === "object") {
      const it = item as any;
      const fileUrl = it.url || it.secure_url || it.path || "";
      let fileName = it.name || it.filename || it.originalName || "Proof File";
      if (fileName === "Proof File" && fileUrl) {
        try {
          const parts = fileUrl.split("/");
          const lastPart = parts[parts.length - 1];
          if (lastPart) fileName = decodeURIComponent(lastPart.split("?")[0]);
        } catch {}
      }
      proofFiles.push({
        url: fileUrl,
        name: fileName,
        size: it.size !== undefined ? (typeof it.size === "number" ? `${Math.round(it.size / 1024)} KB` : String(it.size)) : "File",
        mimeType: it.mimeType || it.type,
        publicId: it.publicId,
        uploadedAt: it.uploadedAt,
      });
    }
  }

  // Fallback to local submission store if proof files empty
  if (proofFiles.length === 0 && id && typeof window !== "undefined") {
    try {
      const rawSub = localStorage.getItem("dimisi-submissions");
      if (rawSub) {
        const list = JSON.parse(rawSub);
        const sub = list.find((s: any) => s.taskId === id);
        if (sub) {
          if (!submittedBy && sub.employeeName) {
            submittedBy = sub.employeeName;
            submittedById = sub.employeeId || "";
          }
          if (!submittedAt && sub.submittedAt) {
            submittedAt = sub.submittedAt;
          }
          if (Array.isArray(sub.files)) {
            for (const sf of sub.files) {
              proofFiles.push({
                url: sf.dataUrl || "",
                name: sf.name,
                size: typeof sf.size === "number" ? `${Math.round(sf.size / 1024)} KB` : String(sf.size),
                mimeType: sf.type,
                dataUrl: sf.dataUrl,
              });
            }
          }
        }
      }
    } catch {}
  }

  // Parse review & feedback info
  let feedback = doc.feedback;
  let reviewStatus = doc.reviewStatus;
  let reviewedAt = doc.reviewedAt;
  let reviewedBy = "";
  let reviewedById = "";
  let reviewedByUser: PopulatedUser | undefined;

  if (doc.reviewedBy) {
    if (typeof doc.reviewedBy === "object") {
      reviewedByUser = doc.reviewedBy;
      reviewedById = doc.reviewedBy._id;
      reviewedBy = doc.reviewedBy.name || "";
    } else {
      reviewedById = String(doc.reviewedBy);
      reviewedBy = String(doc.reviewedBy);
    }
  }

  // Parse structured reviews list
  const rawReviews = Array.isArray(doc.reviews) ? doc.reviews : [];
  const reviews: TaskReviewFeedback[] = rawReviews.map((r: any) => {
    let rName = r.reviewerName;
    let rEmail = r.reviewerEmail;
    let rId = "";
    if (r.reviewerId && typeof r.reviewerId === "object") {
      rId = r.reviewerId._id;
      if (!rName) rName = r.reviewerId.name;
      if (!rEmail) rEmail = r.reviewerId.email;
    } else if (r.reviewerId) {
      rId = String(r.reviewerId);
    }
    return {
      _id: r._id ? String(r._id) : undefined,
      reviewerId: rId,
      reviewerName: rName || "Admin",
      reviewerEmail: rEmail,
      employeeId: r.employeeId ? (typeof r.employeeId === "object" ? r.employeeId._id : String(r.employeeId)) : undefined,
      feedback: r.feedback || "",
      status: r.status === "approved" ? "approved" : "rejected",
      reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toISOString() : new Date().toISOString(),
    };
  });

  // If latest review exists in reviews array, use its details if not directly on doc
  if (reviews.length > 0) {
    const latest = reviews[reviews.length - 1];
    if (!feedback) feedback = latest.feedback;
    if (!reviewStatus) reviewStatus = latest.status;
    if (!reviewedAt) reviewedAt = latest.reviewedAt;
    if (!reviewedBy) reviewedBy = latest.reviewerName;
  }

  // Fallback to rejectionReason if feedback is missing
  if (!feedback && rejectionReason) {
    feedback = rejectionReason;
    if (!reviewStatus) reviewStatus = "rejected";
  }

  // Fallback to Admin Feedback extracted from notes (returned by backend review endpoint)
  if (!feedback && doc.notes && typeof doc.notes === "string" && doc.notes.includes("Admin Feedback:")) {
    const parts = doc.notes.split("Admin Feedback:");
    const extracted = parts[parts.length - 1]?.trim();
    if (extracted) {
      feedback = extracted;
      if (!reviewStatus) reviewStatus = frontendStatus === "completed" ? "approved" : "rejected";
    }
  }

  // Fallback to temporary local storage review store if needed
  let isFeedbackTemporary = false;
  if (id && typeof window !== "undefined") {
    try {
      const rawStore = localStorage.getItem("dimisi-task-reviews");
      if (rawStore) {
        const storeMap = JSON.parse(rawStore);
        const saved = storeMap[id];
        if (saved && saved.feedback) {
          if (!feedback) {
            feedback = saved.feedback;
            isFeedbackTemporary = true;
          }
          if (!reviewStatus) reviewStatus = saved.reviewStatus || (saved.isApproved ? "approved" : "rejected");
          if (!reviewedAt) reviewedAt = saved.reviewedAt;
          if (!reviewedBy) reviewedBy = saved.reviewerName || "Admin";
          if (reviews.length === 0 && saved.feedback) {
            reviews.push({
              reviewerName: saved.reviewerName || "Admin",
              feedback: saved.feedback,
              status: saved.reviewStatus || (saved.isApproved ? "approved" : "rejected"),
              reviewedAt: saved.reviewedAt || new Date().toISOString(),
            });
          }
        }
      }
    } catch {}
  }

  const dueDate = doc.deadline
    ? new Date(doc.deadline).toISOString().slice(0, 10)
    : doc.dueDate
      ? new Date(doc.dueDate).toISOString().slice(0, 10)
      : doc.createdAt
        ? new Date(doc.createdAt).toISOString().slice(0, 10)
        : "";

  const points = Number(doc.rewardPoints ?? 0);

  return {
    _id: id,
    id,
    title: doc.title || (typeof (doc as Record<string, unknown>).name === "string" ? ((doc as Record<string, unknown>).name as string) : "") || "",
    description: doc.description || "",
    category: resolveTaskCategory(doc) !== "Uncategorized" ? resolveTaskCategory(doc) : resolveTaskCategory(raw),
    priority: toFrontendTaskPriority(doc.priority),
    status: frontendStatus,
    rawStatus: doc.status,
    taskType: toFrontendTaskType(doc.type),
    rewardPoints: points,
    points,
    dueDate,
    deadline: doc.deadline,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
    assignedTo: doc.assignedTo,
    assignee,
    assigneeId,
    assigneeCode,
    assigneeEmail,
    createdBy,
    creatorId,
    creatorUser,
    submittedBy: submittedBy || assignee,
    submittedById: submittedById || assigneeId,
    submittedByUser,
    submittedAt,
    feedback,
    isFeedbackTemporary,
    reviewedBy: reviewedBy || (feedback ? "Admin" : undefined),
    reviewedById,
    reviewedByUser,
    reviewedAt,
    reviewStatus,
    reviews,
    notes: doc.notes,
    attachments,
    rawAttachmentUrls,
    proofFiles,
    reviewState: defaultReviewState ?? (rejectionReason && (doc.status === "in_progress" || !doc.status) ? "rejected" : undefined),
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
  const normalizedType = toBackendTaskType(input.taskType);
  if (normalizedType === "project" && input.projectId) {
    fd.append("projectId", input.projectId);
  }
  if (normalizedType === "direct" && input.assigneeId) {
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
