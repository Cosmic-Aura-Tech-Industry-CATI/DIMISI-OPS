import type { AuthUser } from "@/auth/types/auth";

export interface Notice {
  _id: string;
  title: string;
  content: string;
  targetAll: boolean;
  targetDepartments?: string[];
  attachments?: string[];
  createdBy?: AuthUser | string;
  createdAt: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreateNoticeInput {
  title: string;
  content: string;
  targetAll?: boolean;
  targetDepartments?: string[];
  attachments?: File[];
}

export interface UpdateNoticeInput {
  title?: string;
  content?: string;
  targetAll?: boolean;
  targetDepartments?: string[];
  existingAttachments?: string[];
  attachments?: File[];
}

export interface NoticeFilters {
  search?: string;
  department?: string;
  [key: string]: unknown;
}

export interface NoticeListResponse {
  notices: Notice[];
}

export interface NoticeSingleResponse {
  notice: Notice;
}

