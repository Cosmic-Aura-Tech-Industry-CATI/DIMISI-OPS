import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { API_BASE_URL, API_TIMEOUT, API_WITH_CREDENTIALS } from "@/api/config";
import { API_ENDPOINTS } from "@/api/endpoints";
import { toApiError, type ApiError } from "@/api/errors";
import {
  clearTokens,
  getAccessToken,
  getResetToken,
  setAccessToken,
} from "@/api/token-store";

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

let refreshPromise: Promise<string | null> | null = null;

/** Refresh the access token using the httpOnly refresh cookie. De-duplicated. */
export function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= apiClient
    .post<{ accessToken?: string; data?: { accessToken?: string } }>(
      API_ENDPOINTS.auth.refresh,
      undefined,
      { authMode: "none", _retried: true },
    )
    .then((res) => {
      const token = res.data?.accessToken ?? res.data?.data?.accessToken ?? null;
      if (token) setAccessToken(token);
      return token;
    })
    .catch(() => null)
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
    const mode: AuthMode = config?.authMode ?? "bearer";

    const canRetry =
      status === 401 && !!config && !config._retried && mode === "bearer" && !!getAccessToken();

    if (canRetry) {
      config._retried = true;
      const token = await refreshAccessToken();
      if (token) return apiClient(config);

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
