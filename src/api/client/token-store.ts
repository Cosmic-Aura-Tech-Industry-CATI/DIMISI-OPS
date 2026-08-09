/**
 * Token storage.
 *
 * - Tokens are NOT stored in localStorage or sessionStorage (per security requirement).
 * - Access token and refresh token are httpOnly cookies managed by the backend.
 * - Reset token is short-lived in-memory only and used by `PATCH /auth/reset-password`.
 */

type Listener = (token: string | null) => void;

let accessToken: string | null = null;
let resetToken: string | null = null;
const listeners = new Set<Listener>();

/** Rehydrate function (no-op since auth relies on HTTP-only cookies) */
export function hydrateTokens() {
  listeners.forEach((l) => l(accessToken));
}

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  listeners.forEach((l) => l(token));
}

export function getResetToken() {
  return resetToken;
}

export function setResetToken(token: string | null) {
  resetToken = token;
}

export function clearTokens() {
  setAccessToken(null);
  setResetToken(null);
}

/** Subscribe to access-token changes. */
export function subscribeToken(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
