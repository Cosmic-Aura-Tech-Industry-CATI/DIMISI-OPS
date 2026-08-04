import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PasswordInput, PasswordStrength } from "@/components/account-form-parts";
import { isStrongPassword } from "@/lib/password";
import { currentPasswordFor, updatePassword } from "@/lib/accounts";
import {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_SECONDS,
  clearRecoveryOtp,
  logRecovery,
  maskEmail,
  sendPasswordResetEmail,
  sendRecoveryOtp,
  verifyRecoveryOtp,
} from "@/lib/recovery-otp";

export type RecoveryStep = "email" | "otp" | "reset" | "done";

const STEPS: { id: RecoveryStep; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "otp", label: "OTP" },
  { id: "reset", label: "Reset" },
  { id: "done", label: "Completed" },
];

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function validEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function Stepper({ step }: { step: RecoveryStep }) {
  const idx = STEPS.findIndex((s) => s.id === step);
  return (
    <ol className="mb-6 flex items-center gap-1.5 sm:gap-2">
      {STEPS.map((s, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <li key={s.id} className="flex min-w-0 flex-1 items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <div
                className={`h-1 w-full rounded-md transition-colors ${
                  done || active ? "bg-primary" : "bg-border"
                }`}
              />
              <div
                className={`mt-1.5 truncate text-[10px] uppercase tracking-wider sm:text-[11px] ${
                  active
                    ? "text-primary"
                    : done
                      ? "text-foreground"
                      : "text-muted-foreground"
                }`}
              >
                {i + 1}. {s.label}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Unified password recovery wizard, shared by the Login page and
 * Settings → Security → Change password ("Forgot current password?").
 *
 * Steps: verify email → emailed 6-digit OTP → new password → success.
 */
export function PasswordRecovery({
  lockedEmail,
  actor,
  onCancel,
  onFinish,
  finishLabel = "Go to login",
}: {
  /** Settings entry point: the signed-in account email, shown read-only. */
  lockedEmail?: string;
  actor?: { name?: string; code?: string };
  onCancel?: () => void;
  /** Called from the success screen — logs out every session and redirects. */
  onFinish: () => void;
  finishLabel?: string;
}) {
  const [step, setStep] = useState<RecoveryStep>("email");
  const [email, setEmail] = useState(lockedEmail ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [code, setCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [locked, setLocked] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(OTP_MAX_ATTEMPTS);
  const [seconds, setSeconds] = useState(OTP_RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (step !== "otp") return;
    timer.current = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [step]);

  /* ---------------- step 1: email ---------------- */
  const sendCode = async () => {
    setError("");
    const target = (lockedEmail ?? email).trim();
    if (!validEmail(target)) return setError("Enter a valid registered email address.");
    setBusy(true);
    logRecovery("Password Reset Requested", target, "Recovery started from the password wizard.", "success", actor);
    await sendRecoveryOtp(target);
    logRecovery("OTP Sent", target, "A 6-digit recovery code was emailed.", "success", actor);
    setBusy(false);
    setEmail(target);
    setCode("");
    setOtpError("");
    setLocked(false);
    setAttemptsLeft(OTP_MAX_ATTEMPTS);
    setSeconds(OTP_RESEND_SECONDS);
    setStep("otp");
    toast.success("Verification code sent", { description: `We emailed a 6-digit code to ${target}.` });
  };

  /* ---------------- step 2: OTP ---------------- */
  const submitOtp = async (value: string) => {
    if (busy || locked || value.length !== OTP_LENGTH) return;
    setBusy(true);
    setOtpError("");
    const res = await verifyRecoveryOtp(email, value);
    setBusy(false);
    if (res.ok) {
      logRecovery("OTP Verified", email, "Recovery code verified successfully.", "success", actor);
      toast.success("Identity verified");
      setStep("reset");
      return;
    }
    setCode("");
    setAttemptsLeft(res.attemptsLeft);
    if (res.reason === "locked") {
      setLocked(true);
      setOtpError("Too many incorrect attempts. Please request a new OTP.");
      logRecovery("Too Many OTP Attempts", email, "Recovery locked after 5 incorrect codes.", "failed", actor);
    } else if (res.reason === "expired" || res.reason === "no_code") {
      setOtpError("This verification code has expired. Please request a new one.");
      logRecovery("Password Reset Failed", email, "Recovery OTP expired.", "failed", actor);
    } else {
      setOtpError(
        `Incorrect verification code. ${res.attemptsLeft} attempt${res.attemptsLeft === 1 ? "" : "s"} remaining.`,
      );
      logRecovery("Password Reset Failed", email, "Incorrect recovery OTP entered.", "failed", actor);
    }
  };

  const resend = async () => {
    if (seconds > 0 || resending) return;
    setResending(true);
    await sendRecoveryOtp(email);
    logRecovery("OTP Sent", email, "A new recovery code was emailed; the previous code is now invalid.", "success", actor);
    setResending(false);
    setCode("");
    setOtpError("");
    setLocked(false);
    setAttemptsLeft(OTP_MAX_ATTEMPTS);
    setSeconds(OTP_RESEND_SECONDS);
    toast.success("A new verification code has been sent to your email.");
  };

  /* ---------------- step 3: new password ---------------- */
  const savePassword = async () => {
    setError("");
    if (!isStrongPassword(next))
      return setError("New password does not meet all the requirements below.");
    if (next === currentPasswordFor(email))
      return setError("Your new password must be different from your current password.");
    if (next !== confirm) return setError("New password and confirmation do not match.");

    setBusy(true);
    updatePassword(email, next);
    clearRecoveryOtp(email);
    await sendPasswordResetEmail(email);
    setBusy(false);
    logRecovery("Password Reset Successful", email, "Password updated after email OTP verification.", "success", actor);
    setStep("done");
    toast.success("Password reset successful", {
      description: "Please sign in again with your new password.",
    });
  };

  const back = () => {
    if (step === "otp") {
      clearRecoveryOtp(email);
      setStep("email");
      return;
    }
    onCancel?.();
  };

  return (
    <div>
      <Stepper step={step} />

      {/* Step 1 — verify email */}
      {step === "email" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <Label htmlFor="recovery-email">Registered email address</Label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="recovery-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={lockedEmail ?? email}
                readOnly={!!lockedEmail}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-11 rounded-md pl-9 ${lockedEmail ? "cursor-not-allowed opacity-80" : ""}`}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {lockedEmail
                ? "This is the email registered for your account by your administrator."
                : "Use the email your administrator registered for your account."}
            </p>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="h-11 flex-1 rounded-md shadow-glow"
              onClick={() => void sendCode()}
              disabled={busy}
            >
              {busy ? "Sending code…" : "Send OTP"}
            </Button>
            {onCancel && (
              <Button
                variant="ghost"
                className="h-11 rounded-md text-muted-foreground sm:w-auto"
                onClick={onCancel}
                disabled={busy}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 2 — OTP */}
      {step === "otp" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <h3 className="font-display text-lg">Verify your identity</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            A verification code has been sent to your registered email.
          </p>

          <div className="mt-4 flex items-center gap-3 rounded-md border border-border/60 bg-card/50 p-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border/60 bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Registered email
              </div>
              <div className="truncate text-sm font-medium">{maskEmail(email)}</div>
            </div>
          </div>

          <div className="mt-6">
            <InputOTP
              maxLength={OTP_LENGTH}
              value={code}
              onChange={(v) => {
                setCode(v);
                if (v.length === OTP_LENGTH) void submitOtp(v);
              }}
              disabled={busy || locked}
              containerClassName="justify-between gap-1.5 sm:gap-2"
            >
              <InputOTPGroup className="grid w-full grid-cols-6 gap-1.5 sm:gap-2">
                {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="h-12 w-full rounded-md border border-border/60 bg-background/60 text-base font-semibold first:rounded-md last:rounded-md sm:h-14 sm:text-lg"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {otpError ? (
            <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {otpError}
            </p>
          ) : (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              The code expires in 5 minutes. {attemptsLeft} of {OTP_MAX_ATTEMPTS} attempts remaining.
            </p>
          )}

          <Button
            type="button"
            onClick={() => void submitOtp(code)}
            disabled={busy || locked || code.length !== OTP_LENGTH}
            className="mt-6 h-11 w-full rounded-md text-sm shadow-glow"
          >
            {busy ? (
              "Verifying…"
            ) : (
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Verify OTP
              </span>
            )}
          </Button>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void resend()}
              disabled={seconds > 0 || resending}
              className="h-11 rounded-md text-sm"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {seconds > 0 ? `Resend in ${fmt(seconds)}` : resending ? "Sending…" : "Resend OTP"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={back}
              className="h-11 rounded-md text-sm text-muted-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — reset password */}
      {step === "reset" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-start gap-2 rounded-md border border-border/60 bg-card/40 p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              Identity verified for{" "}
              <span className="font-medium text-foreground">{maskEmail(email)}</span>. Create your
              new password below.
            </span>
          </div>

          <div className="space-y-1.5">
            <Label>New password</Label>
            <PasswordInput value={next} onChange={setNext} placeholder="Enter a new password" />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm password</Label>
            <PasswordInput
              value={confirm}
              onChange={setConfirm}
              placeholder="Re-enter new password"
            />
          </div>

          <PasswordStrength value={next} />

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button
            className="h-11 w-full rounded-md shadow-glow"
            onClick={() => void savePassword()}
            disabled={busy}
          >
            {busy ? "Updating…" : "Reset password"}
          </Button>
        </div>
      )}

      {/* Step 4 — success */}
      {step === "done" && (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border/60 bg-card/40 px-4 py-8 text-center animate-in fade-in zoom-in-95">
          <div className="grid h-12 w-12 place-items-center rounded-md border border-primary/30 bg-primary/10 text-primary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="font-display text-lg">Password reset successful</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Your password has been updated successfully. For security reasons, please log in again
            using your new password.
          </p>
          <Button className="mt-2 h-11 w-full rounded-md shadow-glow sm:w-auto" onClick={onFinish}>
            {finishLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
