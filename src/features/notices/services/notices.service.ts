/**
 * Type-safe service functions for the Notices module.
 * Communicates with the backend /api/v1/notices endpoints.
 */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type { MessageResponse } from "@/types/api";
import type {
  CreateNoticeInput,
  Notice,
  NoticeFilters,
  NoticeListResponse,
  NoticeSingleResponse,
  UpdateNoticeInput,
} from "../types";

const { notices: noticeEndpoints } = API_ENDPOINTS;

function buildNoticeFormData(input: CreateNoticeInput | UpdateNoticeInput): FormData {
  const formData = new FormData();
  if ("title" in input && input.title) formData.append("title", input.title);
  if ("content" in input && input.content) formData.append("content", input.content);
  if ("targetAll" in input && input.targetAll !== undefined) {
    formData.append("targetAll", String(input.targetAll));
  }
  if ("targetDepartments" in input && input.targetDepartments) {
    formData.append("targetDepartments", JSON.stringify(input.targetDepartments));
  }
  if ("existingAttachments" in input && input.existingAttachments) {
    formData.append("existingAttachments", JSON.stringify(input.existingAttachments));
  }
  if (input.attachments && input.attachments.length > 0) {
    input.attachments.forEach((file) => {
      formData.append("attachments", file);
    });
  }
  return formData;
}

/** GET /api/v1/notices — lists all notices. */
export async function getNotices(filters?: NoticeFilters): Promise<Notice[]> {
  const res = await http.get<NoticeListResponse | Notice[]>(noticeEndpoints.list, {
    params: filters,
  });
  if (res && typeof res === "object" && "notices" in res) {
    return (res as NoticeListResponse).notices;
  }
  return Array.isArray(res) ? res : [];
}

/** GET /api/v1/notices/:id — retrieves a single notice. */
export async function getNotice(id: string): Promise<Notice> {
  const res = await http.get<NoticeSingleResponse | Notice>(noticeEndpoints.detail(id));
  if (res && typeof res === "object" && "notice" in res) {
    return (res as NoticeSingleResponse).notice;
  }
  return res as Notice;
}

/** POST /api/v1/notices — creates a new notice (supports multipart/form-data for attachments). */
export async function createNotice(input: CreateNoticeInput | FormData): Promise<Notice> {
  const body = input instanceof FormData ? input : buildNoticeFormData(input);
  const res = await http.post<NoticeSingleResponse | Notice>(noticeEndpoints.create, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (res && typeof res === "object" && "notice" in res) {
    return (res as NoticeSingleResponse).notice;
  }
  return res as Notice;
}

/** PATCH /api/v1/notices/:id — updates an existing notice. */
export async function updateNotice(
  id: string,
  input: UpdateNoticeInput | FormData,
): Promise<Notice> {
  const body = input instanceof FormData ? input : buildNoticeFormData(input);
  const res = await http.patch<NoticeSingleResponse | Notice>(noticeEndpoints.update(id), body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (res && typeof res === "object" && "notice" in res) {
    return (res as NoticeSingleResponse).notice;
  }
  return res as Notice;
}

/** DELETE /api/v1/notices/:id — deletes a notice and its files. */
export async function deleteNotice(id: string): Promise<MessageResponse> {
  return await http.delete<MessageResponse>(noticeEndpoints.delete(id));
}

export const noticesService = {
  getNotices,
  getNotice,
  createNotice,
  updateNotice,
  deleteNotice,
};

