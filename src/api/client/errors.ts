import axios, { type AxiosError } from "axios";

/** Normalised error shape every hook/component can rely on. */
export interface ApiError {
  /** HTTP status, 0 when the request never reached the server. */
  status: number;
  /** Human readable message safe to render in the UI. */
  message: string;
  /** Backend error code, when provided. */
  code?: string;
  /** Field level validation errors, when provided. */
  fieldErrors?: Record<string, string[]>;
}

interface BackendErrorBody {
  message?: string | string[];
  error?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

const STATUS_FALLBACK: Record<number, string> = {
  400: "The request was invalid. Please check the details and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  409: "This action conflicts with the current state.",
  422: "Some of the submitted values are invalid.",
  429: "Too many attempts. Please wait a moment and try again.",
  500: "Something went wrong on our side. Please try again.",
};

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<BackendErrorBody>;
    const status = err.response?.status ?? 0;
    const body = err.response?.data;
    const raw = body?.message ?? body?.error;
    const message =
      (Array.isArray(raw) ? raw[0] : raw) ??
      STATUS_FALLBACK[status] ??
      (status === 0
        ? "Unable to reach the server. Check your connection and try again."
        : "Unexpected error. Please try again.");

    return { status, message, code: body?.code, fieldErrors: body?.errors };
  }

  if (error instanceof Error) return { status: 0, message: error.message };
  return { status: 0, message: "Unexpected error. Please try again." };
}

export function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "status" in value && "message" in value;
}
