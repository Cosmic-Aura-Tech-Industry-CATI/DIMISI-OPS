/**
 * OTP channel dedicated to the unified "Forgot password" recovery workflow.
 *
 * Namespaced so a pending login OTP or Settings → Change password OTP is never
 * invalidated by a recovery request (and vice versa). Both entry points
 * (Login page and Settings → Security) share this single channel.
 */
import { clearOtp, sendOtp, verifyOtp, type OtpVerifyResult } from "@/lib/otp";
import { logAudit } from "@/lib/audit-log";

export {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_SECONDS,
  OTP_TTL_MS,
  maskEmail,
} from "@/lib/otp";
export type { OtpVerifyResult };

const scope = (email: string) => `pwd-reset::${email.trim().toLowerCase()}`;

export function sendRecoveryOtp(email: string) {
  return sendOtp(scope(email));
}

export function verifyRecoveryOtp(email: string, code: string) {
  return verifyOtp(scope(email), code);
}

export function clearRecoveryOtp(email: string) {
  clearOtp(scope(email));
}

/** Mock delivery of the "Password Changed Successfully" notification. */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 250));
  if (import.meta.env.DEV) {
    console.info(
      `[mock mailer] To: ${email}\nSubject: Password Changed Successfully\n\n` +
        "Your password for the Dimisi Employee Management System has been successfully changed.\n" +
        "If you did not perform this action, please contact your system administrator immediately.",
    );
  }
}

function deviceMeta() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const browser = /Edg/.test(ua)
    ? "Edge"
    : /Chrome/.test(ua)
      ? "Chrome"
      : /Firefox/.test(ua)
        ? "Firefox"
        : /Safari/.test(ua)
          ? "Safari"
          : "Unknown browser";
  const device = /Mobi|Android|iPhone/.test(ua)
    ? "Mobile"
    : /iPad|Tablet/.test(ua)
      ? "Tablet"
      : "Desktop";
  return { device, browser, ip: "192.168.1.24" };
}

/** Shared audit helper for every step of the recovery workflow. */
export function logRecovery(
  action: string,
  email: string,
  details: string,
  status: "success" | "failed" = "success",
  actor?: { name?: string; code?: string },
) {
  const m = deviceMeta();
  logAudit({
    category: "authentication",
    action,
    target: "Password recovery",
    details: `${details} · Account: ${email} · Device: ${m.device} · Browser: ${m.browser} · IP: ${m.ip}`,
    status,
    actorName: actor?.name ?? email,
    actorId: actor?.code ?? "UNKNOWN",
  });
}
