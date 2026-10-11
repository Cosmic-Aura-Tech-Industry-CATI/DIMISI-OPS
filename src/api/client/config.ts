/**
 * Runtime API configuration.
 *
 * The base URL is NEVER hardcoded — it comes from the `VITE_API_BASE_URL`
 * environment variable (see `.env`). Everything else in the API layer builds
 * on top of these values.
 */

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api/v1";

/** Base URL of the backend, without a trailing slash. */
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

/** Default timeout for every request (ms). */
export const API_TIMEOUT = 20_000;

/** Send cookies (refresh-token cookie) with cross-site requests. */
export const API_WITH_CREDENTIALS = true;

/**
 * Resolves a v2 API endpoint path/URL cleanly across local proxy and production environments.
 */
export function getApiV2Endpoint(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://")) {
    const root = API_BASE_URL.replace(/\/api\/v[0-9]+$/i, "");
    return `${root}/api/v2${cleanPath}`;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api/v2${cleanPath}`;
  }
  return `/api/v2${cleanPath}`;
}

if (!API_BASE_URL && import.meta.env.DEV) {
  console.warn(
    "[api] VITE_API_BASE_URL is not set — requests will be sent relative to the current origin.",
  );
}
