/** Types for the notifications module. */

export type NotificationType =
  | "deadline_reminder"
  | "task_approval"
  | "points_earned"
  | "task_assignment"
  | "review_request"
  | "weekly_digest"
  | "new_submission"
  | "new_employee"
  | "new_admin"
  | "approved"
  | "rejected"
  | "submission"
  | string;

export interface NotificationItem {
  _id: string;
  id?: string;
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
  taskId?: string;
}

export interface NotificationsResponse {
  status?: string;
  results?: number;
  data: NotificationItem[];
}
