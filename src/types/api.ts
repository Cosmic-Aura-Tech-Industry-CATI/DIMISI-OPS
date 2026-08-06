/** Generic response envelope used by the backend. */
export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
}

/** Simple message-only response. */
export interface MessageResponse {
  success?: boolean;
  message: string;
}

export type { ApiError } from "@/api/errors";
