/**
 * Runtime API configuration.
 *
 * The base URL is NEVER hardcoded — it comes from the `VITE_API_BASE_URL`
 * environment variable (see `.env`). Everything else in the API layer builds
 * on top of these values.
 */

let rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api/v1";

if (rawBaseUrl.includes(":3000")) {
  rawBaseUrl = rawBaseUrl.replace(":3000", ":8080");
}

if (rawBaseUrl.includes("localhost:8080") && !rawBaseUrl.includes("/api/v1")) {
  rawBaseUrl = `${rawBaseUrl.replace(/\/+$/, "")}/api/v1`;
}

/** Base URL of the backend, without a trailing slash. */
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

/** Default timeout for every request (ms). */
export const API_TIMEOUT = 20_000;

/** Send cookies (refresh-token cookie) with cross-site requests. */
export const API_WITH_CREDENTIALS = true;

if (!API_BASE_URL && import.meta.env.DEV) {
  console.warn(
    "[api] VITE_API_BASE_URL is not set — requests will be sent relative to the current origin.",
  );
}
