/**
 * Project entity models, API payloads, and data adapters matching the backend contract.
 */

// ==========================================
// 1. Backend Contract Types
// ==========================================

export type BackendProjectStatus = "Active" | "Inactive" | "Completed" | "Archived";

export interface ProjectAnalytics {
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
}

export interface ProjectManagerRef {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  designation?: string;
}

export interface ProjectCreatorRef {
  _id: string;
  id?: string;
  name: string;
  email?: string;
}

export interface BackendProject {
  _id: string;
  name: string;
  code?: string;
  managerId?: ProjectManagerRef | string | null;
  description?: string;
  status: BackendProjectStatus | string;
  color?: string;
  isActive: boolean;
  createdBy: ProjectCreatorRef | string;
  createdAt: string;
  updatedAt: string;
  analytics?: ProjectAnalytics;
}

export interface ProjectFilters {
  status?: string;
  isActive?: boolean | string;
  managerId?: string;
  search?: string;
  [key: string]: unknown;
}

export interface BackendCreateProjectPayload {
  name: string;
  code?: string;
  managerId?: string;
  description?: string;
  status?: BackendProjectStatus;
  color?: string;
}

export interface BackendUpdateProjectPayload {
  name?: string;
  code?: string;
  managerId?: string | null;
  description?: string;
  status?: BackendProjectStatus;
  color?: string;
  isActive?: boolean;
}

export interface ProjectListResponse {
  projects: BackendProject[];
}

export interface ProjectSingleResponse {
  project: BackendProject;
}

// ==========================================
// 2. Frontend Normalized Types
// ==========================================

export type FrontendProjectStatus =
  | "active"
  | "inactive"
  | "archived"
  | "completed"
  | "Active"
  | "Inactive"
  | "Archived"
  | "Completed";

export interface Project {
  _id: string;
  id: string; // alias for _id ensuring backward compatibility
  code: string;
  name: string;
  description: string;
  manager?: string; // string representation for table / card displays
  managerId?: ProjectManagerRef | string | null;
  status: FrontendProjectStatus;
  color?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  templates: string[];
  analytics: ProjectAnalytics;
}

export interface CreateProjectPayload {
  name: string;
  code?: string;
  managerId?: string;
  manager?: string;
  description?: string;
  status?: FrontendProjectStatus;
  color?: string;
  createdBy?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  code?: string;
  managerId?: string | null;
  manager?: string;
  description?: string;
  status?: FrontendProjectStatus;
  color?: string;
  isActive?: boolean;
}

// ==========================================
// 3. UI Helpers & Styling
// ==========================================

export const projectColors = [
  "#C9A961",
  "#8FB8A8",
  "#B98B7A",
  "#7E93B8",
  "#A98BB9",
  "#D9D9D9",
];

export const projectStatusLabel: Record<string, string> = {
  active: "Active",
  Active: "Active",
  inactive: "Inactive",
  Inactive: "Inactive",
  archived: "Archived",
  Archived: "Archived",
  completed: "Completed",
  Completed: "Completed",
};

export const projectStatusStyles: Record<string, string> = {
  active: "bg-success/15 text-success",
  Active: "bg-success/15 text-success",
  inactive: "bg-muted text-muted-foreground",
  Inactive: "bg-muted text-muted-foreground",
  archived: "bg-warning/15 text-warning",
  Archived: "bg-warning/15 text-warning",
  completed: "bg-primary/15 text-primary",
  Completed: "bg-primary/15 text-primary",
};

// ==========================================
// 4. Adapter Functions
// ==========================================

/** Normalizes any status representation to backend enum: 'Active' | 'Inactive' | 'Archived' | 'Completed' */
export function normalizeStatusToBackend(status?: string): BackendProjectStatus {
  if (!status) return "Active";
  const s = status.toLowerCase();
  if (s === "active") return "Active";
  if (s === "inactive") return "Inactive";
  if (s === "archived") return "Archived";
  if (s === "completed") return "Completed";
  return "Active";
}

/** Maps raw backend project object to frontend Project entity */
export function mapProjectResponse(raw: BackendProject): Project {
  const resolvedManager =
    typeof raw.managerId === "object" && raw.managerId !== null
      ? raw.managerId.name
      : typeof raw.managerId === "string"
        ? raw.managerId
        : undefined;

  const resolvedCreator =
    typeof raw.createdBy === "object" && raw.createdBy !== null
      ? raw.createdBy.name
      : typeof raw.createdBy === "string"
        ? raw.createdBy
        : "Dimisi Directors";

  const rawStatus = raw.status || (raw.isActive === false ? "Archived" : "Active");
  const normalizedStatus = (rawStatus.toLowerCase() as FrontendProjectStatus);

  return {
    _id: raw._id,
    id: raw._id,
    code: raw.code || raw._id.slice(-6).toUpperCase(),
    name: raw.name,
    description: raw.description || "",
    manager: resolvedManager,
    managerId: raw.managerId,
    status: normalizedStatus,
    color: raw.color || projectColors[0],
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt,
    createdBy: resolvedCreator,
    templates: [],
    analytics: raw.analytics || {
      totalTasks: 0,
      completedTasks: 0,
      progressPercentage: 0,
    },
  };
}

/** Maps frontend creation payload to backend request body */
export function mapCreateProjectPayload(payload: CreateProjectPayload): BackendCreateProjectPayload {
  const body: BackendCreateProjectPayload = {
    name: payload.name.trim(),
  };

  if (payload.code?.trim()) {
    body.code = payload.code.trim();
  }

  if (payload.description !== undefined) {
    body.description = payload.description.trim();
  }

  if (payload.managerId && payload.managerId.trim()) {
    body.managerId = payload.managerId.trim();
  }

  if (payload.status) {
    body.status = normalizeStatusToBackend(payload.status);
  }

  if (payload.color) {
    body.color = payload.color;
  }

  return body;
}

/** Maps frontend update payload to backend request body */
export function mapUpdateProjectPayload(payload: UpdateProjectPayload): BackendUpdateProjectPayload {
  const body: BackendUpdateProjectPayload = {};

  if (payload.name !== undefined) {
    body.name = payload.name.trim();
  }

  if (payload.code !== undefined) {
    body.code = payload.code.trim();
  }

  if (payload.description !== undefined) {
    body.description = payload.description.trim();
  }

  if (payload.managerId !== undefined) {
    body.managerId = payload.managerId ? payload.managerId.trim() : null;
  }

  if (payload.status !== undefined) {
    body.status = normalizeStatusToBackend(payload.status);
  }

  if (payload.color !== undefined) {
    body.color = payload.color;
  }

  if (payload.isActive !== undefined) {
    body.isActive = payload.isActive;
  }

  return body;
}
