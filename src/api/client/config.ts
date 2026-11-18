/**
 * Runtime API configuration.
 *
 * The base URL is NEVER hardcoded — it comes from the `VITE_API_BASE_URL`
 * environment variable (see `.env`). Everything else in the API layer builds
 * on top of these values.
 */

const rawBaseUrl = (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE_URL) || "/api/v1";

/** Base URL of the backend, without a trailing slash. */
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

/** Known backend origin fallback */
export const DEFAULT_BACKEND_ORIGIN = "https://api.dimisi.tech";

/**
 * Returns the backend root origin (e.g. "https://api.dimisi.tech").
 * Resolves from API_BASE_URL if set, or local proxy when running on localhost,
 * or falls back to the live backend server.
 */
export function getBackendOrigin(): string {
  if (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://")) {
    return API_BASE_URL.replace(/\/api\/v[0-9]+$/i, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return window.location.origin;
    }
  }
  return DEFAULT_BACKEND_ORIGIN;
}

/** Default timeout for every request (ms). */
export const API_TIMEOUT = 20_000;

/** Send cookies (refresh-token cookie) with cross-site requests. */
export const API_WITH_CREDENTIALS = true;

/**
 * Resolves a v2 API endpoint path/URL cleanly across local proxy and production environments.
 */
export function getApiV2Endpoint(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const origin = getBackendOrigin();
  return `${origin}/api/v2${cleanPath}`;
}

if (!API_BASE_URL && typeof import.meta !== "undefined" && import.meta?.env?.DEV) {
  console.warn(
    "[api] VITE_API_BASE_URL is not set — requests will be sent relative to the current origin.",
  );
}
