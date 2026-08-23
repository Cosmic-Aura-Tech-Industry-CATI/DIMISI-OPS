import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { API_BASE_URL, API_TIMEOUT, API_WITH_CREDENTIALS } from "./config";
import { API_ENDPOINTS } from "./endpoints";
import { toApiError, type ApiError } from "./errors";
import { clearTokens, getAccessToken, getResetToken, setAccessToken } from "./token-store";

/** Which credential a request needs. Defaults to `bearer`. */
export type AuthMode = "none" | "bearer" | "reset";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Credential attached by the request interceptor. Default: `bearer`. */
    authMode?: AuthMode;
    /** Internal — prevents infinite refresh loops. */
    _retried?: boolean;
  }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: API_TIMEOUT,
  // Required so the httpOnly refresh-token cookie travels with requests.
  withCredentials: API_WITH_CREDENTIALS,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

/* ------------------------------ request layer ------------------------------ */

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const mode: AuthMode = config.authMode ?? "bearer";

  if (mode === "bearer") {
    const token = getAccessToken();
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
  } else if (mode === "reset") {
    const token = getResetToken();
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
  } else {
    config.headers.delete("Authorization");
  }

  return config;
});

/* ------------------------------ response layer ----------------------------- */

/** Called when the session can no longer be recovered (AuthProvider subscribes). */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

let refreshPromise: Promise<boolean> | null = null;
let refreshFailed = false;

export function resetRefreshState() {
  refreshFailed = false;
  refreshPromise = null;
}

/** Refresh the access token using the httpOnly refresh cookie. De-duplicated. */
export function refreshAccessToken(): Promise<boolean> {
  if (refreshFailed) return Promise.resolve(false);
  if (refreshPromise) return refreshPromise;

  const url = `${API_BASE_URL || ""}${API_ENDPOINTS.auth.refresh}`;

  refreshPromise = axios
    .post<{ status?: string; message?: string }>(url, undefined, {
      timeout: API_TIMEOUT,
      withCredentials: API_WITH_CREDENTIALS,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    })
    .then((res) => {
      const ok = res.status === 200 || res.data?.status === "success";
      if (ok) {
        refreshFailed = false;
      } else {
        refreshFailed = true;
      }
      return ok;
    })
    .catch(() => {
      refreshFailed = true;
      return false;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (InternalAxiosRequestConfig & AxiosRequestConfig) | undefined;
    const status = error.response?.status;
    const url = config?.url ?? "";

    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/verify-login") ||
      url.includes("/auth/forget-password") ||
      url.includes("/auth/verify-reset-otp") ||
      url.includes("/auth/reset-password") ||
      url.includes("/auth/resend-otp") ||
      url.includes("/auth/refresh");

    const canRetry = status === 401 && !!config && !config._retried && !isAuthEndpoint;

    if (canRetry) {
      config._retried = true;
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiClient(config);
      }

      clearTokens();
      onUnauthorized?.();
    }

    return Promise.reject(toApiError(error));
  },
);


/* -------------------------------- helpers --------------------------------- */

/** Unwraps `{ data: T }` envelopes while still supporting bare payloads. */
function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export const http = {
  get: async <T>(url: string, config?: AxiosRequestConfig) =>
    unwrap<T>((await apiClient.get(url, config)).data),
  post: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    unwrap<T>((await apiClient.post(url, body, config)).data),
  patch: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    unwrap<T>((await apiClient.patch(url, body, config)).data),
  put: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    unwrap<T>((await apiClient.put(url, body, config)).data),
  delete: async <T>(url: string, config?: AxiosRequestConfig) =>
    unwrap<T>((await apiClient.delete(url, config)).data),
};

export type { ApiError };
