export type NoticeType =
  | "announcement"
  | "important"
  | "meeting"
  | "holiday"
  | "maintenance"
  | "event"
  | "policy"
  | "policy_update";

export type NoticePriority = "low" | "medium" | "high" | "urgent";

export type NoticeStatus = "draft" | "published" | "pinned" | "expired";

export interface NoticeDepartment {
  _id: string;
  name: string;
  code?: string;
}

export interface NoticeCreator {
  _id?: string;
  name?: string;
  empId?: string;
  email?: string;
}

export interface Notice {
  _id: string;
  id?: string;
  headline: string;
  title?: string;
  content: string;
  type: NoticeType;
  priority: NoticePriority;
  status: NoticeStatus;
  targetAll: boolean;
  targetDepartments?: Array<NoticeDepartment | string>;
  expiryDate?: string;
  attachments?: string[];
  createdBy?: NoticeCreator | string;
  createdAt: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreateNoticeInput {
  headline: string;
  content: string;
  type?: NoticeType;
  priority?: NoticePriority;
  status?: NoticeStatus;
  targetAll?: boolean;
  targetDepartments?: string[];
  expiryDate?: string;
  attachments?: File[];
}

export interface UpdateNoticeInput {
  headline?: string;
  content?: string;
  type?: NoticeType;
  priority?: NoticePriority;
  status?: NoticeStatus;
  targetAll?: boolean;
  targetDepartments?: string[];
  expiryDate?: string;
  existingAttachments?: string[];
  attachments?: File[];
}

export interface NoticeFilters {
  status?: NoticeStatus;
  type?: NoticeType;
  priority?: NoticePriority;
  targetAll?: boolean;
  search?: string;
  [key: string]: unknown;
}

export interface NoticeListResponse {
  notices: Notice[];
}

export interface NoticeSingleResponse {
  notice: Notice;
}
