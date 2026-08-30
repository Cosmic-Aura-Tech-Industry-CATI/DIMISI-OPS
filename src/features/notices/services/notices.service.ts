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

/** Ensures Notice fields have backwards-compatible id and title properties. */
export function normalizeNotice(notice: Notice): Notice {
  if (!notice) return notice;
  return {
    ...notice,
    id: notice._id || notice.id || "",
    title: notice.headline || notice.title || "",
  };
}

function buildNoticeFormData(input: CreateNoticeInput | UpdateNoticeInput): FormData {
  const formData = new FormData();
  
  if ("headline" in input && input.headline !== undefined) {
    formData.append("headline", input.headline);
  }
  if ("content" in input && input.content !== undefined) {
    formData.append("content", input.content);
  }
  if (input.type) {
    formData.append("type", input.type);
  }
  if (input.priority) {
    formData.append("priority", input.priority);
  }
  if (input.status) {
    formData.append("status", input.status);
  }
  if (input.targetAll !== undefined) {
    formData.append("targetAll", String(Boolean(input.targetAll)));
  }
  if (input.targetDepartments) {
    formData.append("targetDepartments", JSON.stringify(input.targetDepartments));
  }
  if ("expiryDate" in input && input.expiryDate) {
    formData.append("expiryDate", input.expiryDate);
  }
  if ("existingAttachments" in input && input.existingAttachments) {
    formData.append("existingAttachments", JSON.stringify(input.existingAttachments));
  }
  if (input.attachments && input.attachments.length > 0) {
    input.attachments.forEach((file) => {
      if (file instanceof File) {
        formData.append("attachments", file);
      }
    });
  }
  return formData;
}

/** GET /api/v1/notices — lists all notices. */
export async function getNotices(filters?: NoticeFilters): Promise<Notice[]> {
  const res = await http.get<NoticeListResponse | Notice[]>(noticeEndpoints.list, {
    params: filters,
  });
  
  let rawList: Notice[] = [];
  if (res && typeof res === "object" && "notices" in res && Array.isArray((res as NoticeListResponse).notices)) {
    rawList = (res as NoticeListResponse).notices;
  } else if (Array.isArray(res)) {
    rawList = res;
  }
  
  return rawList.map(normalizeNotice);
}

/** GET /api/v1/notices/:id — retrieves a single notice. */
export async function getNotice(id: string): Promise<Notice> {
  const res = await http.get<NoticeSingleResponse | Notice>(noticeEndpoints.detail(id));
  let notice: Notice;
  if (res && typeof res === "object" && "notice" in res) {
    notice = (res as NoticeSingleResponse).notice;
  } else {
    notice = res as Notice;
  }
  return normalizeNotice(notice);
}

/** POST /api/v1/notices — creates a new notice (supports multipart/form-data for attachments). */
export async function createNotice(input: CreateNoticeInput | FormData): Promise<Notice> {
  const body = input instanceof FormData ? input : buildNoticeFormData(input);
  const res = await http.post<NoticeSingleResponse | Notice>(noticeEndpoints.create, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  let notice: Notice;
  if (res && typeof res === "object" && "notice" in res) {
    notice = (res as NoticeSingleResponse).notice;
  } else {
    notice = res as Notice;
  }
  return normalizeNotice(notice);
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
  let notice: Notice;
  if (res && typeof res === "object" && "notice" in res) {
    notice = (res as NoticeSingleResponse).notice;
  } else {
    notice = res as Notice;
  }
  return normalizeNotice(notice);
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
