/** Types for the notifications and calling module. */

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
  recipientType?: "User" | "PanelUser" | string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
  taskId?: string;
  metadata?: Record<string, unknown>;
  dynamicData?: Record<string, unknown>;
}

export interface NotificationsResponse {
  status?: string;
  results?: number;
  data: NotificationItem[];
}

/* ----------------------------- Calling Events ----------------------------- */

export type CallType = "audio" | "video";

export type CallStatus =
  | "idle"
  | "incoming"
  | "outgoing"
  | "ringing"
  | "connected"
  | "ended"
  | "declined"
  | "missed"
  | "busy";

export interface IncomingCallPayload {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  callerRole?: string;
  callType: CallType;
  channelId?: string;
  roomUrl?: string;
  timestamp?: string | number;
  metadata?: Record<string, unknown>;
}

export interface OutgoingCallPayload {
  callId: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  callType: CallType;
  channelId?: string;
  roomUrl?: string;
}

export interface CallSignalPayload {
  callId: string;
  senderId: string;
  targetId: string;
  signal: unknown;
}

export interface CallEndedPayload {
  callId: string;
  reason?: "normal" | "declined" | "timeout" | "busy" | "error";
  durationSeconds?: number;
}

export type CallEventName =
  | "incoming_call"
  | "call_accepted"
  | "call_rejected"
  | "call_ended"
  | "call_signal"
  | "call_missed"
  | "call_ringing"
  | "call_busy"
  | "notification_created"
  | "user_event";

export interface SocketUserEvent<T = any> {
  event: CallEventName | string;
  notification?: NotificationItem;
  [key: string]: any;
}
