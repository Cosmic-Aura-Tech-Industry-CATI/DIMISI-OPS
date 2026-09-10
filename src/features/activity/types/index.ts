/** Types for the activity module. */

export type ActivityScope = "PERSONAL" | "ADMIN" | "ORG";

export type AuditCategory =
  | "employee"
  | "admin"
  | "task"
  | "project"
  | "department"
  | "designation"
  | "notice"
  | "authentication"
  | "reports"
  | "settings";

export type AuditStatus = "success" | "failed";

export type ActivityType =
  | "task_assigned"
  | "task_created"
  | "task_deleted"
  | "task_completed"
  | "project_joined"
  | "task_approved"
  | "task_rejected"
  | "project_created"
  | "project_archived"
  | "project_deleted"
  | "department_created"
  | "department_deleted"
  | "designation_created"
  | "designation_deleted"
  | "notice_created"
  | "notice_deleted"
  | "workspace_settings_updated"
  | "employee_added"
  | "employee_removed"
  | "department_changed"
  | "designation_changed"
  | "admin_added"
  | "admin_removed"
  | "login";

export interface ActivityActor {
  _id: string;
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  empId?: string;
}

export interface ActivityLog {
  _id: string;
  id?: string;
  actorId: ActivityActor | string;
  action: ActivityType | string;
  entityType: AuditCategory | string;
  entityId?: string;
  scope: ActivityScope;
  status?: AuditStatus;
  metadata?: Record<string, unknown>;
  createdAt: string | Date;
}

export interface PaginatedActivityResponse {
  data: ActivityLog[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ActivityQueryFilters {
  page?: number;
  limit?: number;
  entityType?: string;
  startDate?: string | Date;
  endDate?: string | Date;
}
