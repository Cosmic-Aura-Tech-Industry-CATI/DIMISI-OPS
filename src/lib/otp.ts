/**
 * Mock OTP service for the mandatory second login step.
 *
 * Everything lives behind this small async API so a real backend
 * (`POST /auth/otp/send`, `POST /auth/otp/verify`) can be dropped in later
 * without touching the UI: keep the signatures, replace the bodies.
 *
 * SECURITY: the generated code is never returned to the caller and never
 * rendered. In this frontend-only build it is "delivered" by a mock mailer.
 */

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const OTP_RESEND_SECONDS = 30;
export const OTP_MAX_ATTEMPTS = 5;

export type OtpFailure = "expired" | "invalid" | "locked" | "no_code";

export interface OtpVerifyResult {
  ok: boolean;
  reason?: OtpFailure;
  attemptsLeft: number;
}

interface OtpRecord {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
  locked: boolean;
}

/** In-memory only: a page reload invalidates any pending challenge. */
const challenges = new Map<string, OtpRecord>();

function key(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Demo mode: every login accepts the fixed code below. Set to null (or remove)
 * once real email delivery is wired up — the random generator stays intact.
 */
export const DEMO_OTP: string | null = "123456";

function generateCode(): string {
  if (DEMO_OTP) return DEMO_OTP;
  const buf = new Uint32Array(1);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    buf[0] = Math.floor(Math.random() * 0xffffffff);
  }
  return String(buf[0] % 10 ** OTP_LENGTH).padStart(OTP_LENGTH, "0");
}


/** Mock email delivery. Swap for a real transactional email API later. */
async function deliverEmail(email: string, code: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 450));
  if (import.meta.env.DEV) {
    // Dev-only console delivery; never surfaced in the UI.
    console.info(`[mock mailer] OTP for ${email}: ${code}`);
  }
}

/**
 * Generate + send a fresh OTP. Any previously issued code for this email is
 * invalidated immediately, and the attempt counter/lock is reset.
 */
export async function sendOtp(email: string): Promise<{ ok: boolean; expiresAt: number }> {
  const code = generateCode();
  const expiresAt = Date.now() + OTP_TTL_MS;
  challenges.set(key(email), { code, email, expiresAt, attempts: 0, locked: false });
  await deliverEmail(email, code);
  return { ok: true, expiresAt };
}

/** Verify a submitted code against the latest challenge for this email. */
export async function verifyOtp(email: string, input: string): Promise<OtpVerifyResult> {
  await new Promise((r) => setTimeout(r, 350));
  const rec = challenges.get(key(email));
  if (!rec) return { ok: false, reason: "no_code", attemptsLeft: 0 };
  if (rec.locked) return { ok: false, reason: "locked", attemptsLeft: 0 };
  if (Date.now() > rec.expiresAt) {
    challenges.delete(key(email));
    return { ok: false, reason: "expired", attemptsLeft: 0 };
  }

  if (input.trim() === rec.code) {
    challenges.delete(key(email));
    return { ok: true, attemptsLeft: OTP_MAX_ATTEMPTS };
  }

  rec.attempts += 1;
  const attemptsLeft = Math.max(0, OTP_MAX_ATTEMPTS - rec.attempts);
  if (attemptsLeft === 0) {
    rec.locked = true;
    return { ok: false, reason: "locked", attemptsLeft: 0 };
  }
  return { ok: false, reason: "invalid", attemptsLeft };
}

/** Drop a pending challenge (e.g. user goes back to the login form). */
export function clearOtp(email: string) {
  challenges.delete(key(email));
}

/** Mask an address for display: jo•••@dimisi.com */
export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const head = user.slice(0, 2);
  return `${head}${"•".repeat(Math.max(3, user.length - 2))}@${domain}`;
}
