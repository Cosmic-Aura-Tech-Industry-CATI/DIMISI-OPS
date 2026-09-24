/**
 * Token storage.
 *
 * Manages access token and reset token with fallback synchronization.
 */

type Listener = (token: string | null) => void;

const ACCESS_TOKEN_KEY = "dimisi_access_token";

let accessToken: string | null = (() => {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY) || null;
  } catch {
    return null;
  }
})();

let resetToken: string | null = null;
const listeners = new Set<Listener>();

/** Rehydrate function */
export function hydrateTokens() {
  try {
    const stored = localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (stored && !accessToken) {
      accessToken = stored;
    }
  } catch {}
  listeners.forEach((l) => l(accessToken));
}

export function getAccessToken() {
  if (!accessToken) {
    try {
      accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY) || null;
    } catch {}
  }
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  try {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  } catch {}
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

