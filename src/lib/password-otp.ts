/**
 * OTP channel dedicated to the Settings → Security → Change password flow.
 *
 * It reuses the same mock OTP engine as login but under a namespaced key, so
 * a pending login challenge is never invalidated by a password change (and
 * vice versa). The login OTP flow is untouched.
 */
import { clearOtp, sendOtp, verifyOtp, type OtpVerifyResult } from "@/lib/otp";

export {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_SECONDS,
  OTP_TTL_MS,
  maskEmail,
} from "@/lib/otp";
export type { OtpVerifyResult };

/** Namespaced challenge key — keeps this flow separate from login. */
const scope = (email: string) => `pwd-change::${email.trim().toLowerCase()}`;

export function sendPasswordOtp(email: string) {
  return sendOtp(scope(email));
}

export function verifyPasswordOtp(email: string, code: string) {
  return verifyOtp(scope(email), code);
}

export function clearPasswordOtp(email: string) {
  clearOtp(scope(email));
}

/** Mock confirmation email sent after a successful password change. */
export async function sendPasswordChangedEmail(email: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 250));
  if (import.meta.env.DEV) {
    console.info(
      `[mock mailer] To: ${email}\nSubject: Password Changed Successfully\n\n` +
        "Your password for the Dimisi Employee Management System was changed successfully.\n" +
        "If you did not perform this action, please contact your administrator immediately.",
    );
  }
}
