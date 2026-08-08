/**
 * Token storage.
 *
 * - Access token lives in memory (safest against XSS) and is mirrored to
 *   `sessionStorage` so a page reload does not drop the session.
 * - Refresh token is an httpOnly cookie owned by the backend — never touched here.
 * - Reset token is short-lived and only used by `PATCH /auth/reset-password`.
 */

const ACCESS_KEY = "dimisi.access-token";
const RESET_KEY = "dimisi.reset-token";

type Listener = (token: string | null) => void;

let accessToken: string | null = null;
let resetToken: string | null = null;
const listeners = new Set<Listener>();

const isBrowser = typeof window !== "undefined";

function read(key: string) {
  if (!isBrowser) return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  if (!isBrowser) return;
  try {
    if (value) window.sessionStorage.setItem(key, value);
    else window.sessionStorage.removeItem(key);
  } catch {
    /* storage unavailable — memory only */
  }
}

/** Rehydrate from sessionStorage. Call once on the client (AuthProvider does it). */
export function hydrateTokens() {
  if (!isBrowser) return;
  accessToken = read(ACCESS_KEY);
  resetToken = read(RESET_KEY);
  listeners.forEach((l) => l(accessToken));
}

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  write(ACCESS_KEY, token);
  listeners.forEach((l) => l(token));
}

export function getResetToken() {
  return resetToken;
}

export function setResetToken(token: string | null) {
  resetToken = token;
  write(RESET_KEY, token);
}

export function clearTokens() {
  setAccessToken(null);
  setResetToken(null);
}

/** Subscribe to access-token changes (used to sync auth context across tabs/logic). */
export function subscribeToken(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
