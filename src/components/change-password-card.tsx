import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Key,
  Mail,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PasswordInput, PasswordStrength } from "@/components/account-form-parts";
import { PasswordRecovery } from "@/components/password-recovery";
import { useAuth } from "@/lib/auth";
import { isStrongPassword } from "@/lib/password";
import { logAudit } from "@/lib/audit-log";
import { currentPasswordFor, updatePassword, verifyCurrentPassword } from "@/lib/accounts";
import {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_SECONDS,
  clearPasswordOtp,
  sendPasswordOtp,
  sendPasswordChangedEmail,
  verifyPasswordOtp,
} from "@/lib/password-otp";

type Step = "current" | "otp" | "new" | "done";

type WrapperProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Mock request metadata recorded with every audit entry. */
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

/**
 * Settings → Security → Change password.
 *
 * Three gated steps: verify current password → verify emailed OTP →
 * create a new password. The OTP always goes to the account email that the
 * director/admin registered when the account was created.
 */
export function ChangePasswordCard({
  wrapper: Wrapper,
}: {
  wrapper: (props: WrapperProps) => React.ReactElement;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const email = user?.email ?? "";

  const [step, setStep] = useState<Step>("current");
  const [recovery, setRecovery] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // OTP state
  const [code, setCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [locked, setLocked] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(OTP_MAX_ATTEMPTS);
  const [seconds, setSeconds] = useState(OTP_RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step !== "otp") return;
    timer.current = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [step]);

  const audit = (action: string, target: string, details: string) => {
    const m = deviceMeta();
    logAudit({
      category: "authentication",
      action,
      target,
      details: `${details} · Device: ${m.device} · Browser: ${m.browser} · IP: ${m.ip}`,
      actorName: user?.name,
      actorId: user?.code,
    });
  };

  const portal = user?.role === "admin" ? "Admin portal" : "Employee portal";

  const resetAll = () => {
    setStep("current");
    setCurrent("");
    setNext("");
    setConfirm("");
    setError("");
    setCode("");
    setOtpError("");
    setLocked(false);
    setAttemptsLeft(OTP_MAX_ATTEMPTS);
    if (email) clearPasswordOtp(email);
  };

  const cancel = (logIt = true) => {
    if (logIt && step !== "current")
      audit("Password Change Cancelled", portal, "User cancelled the password change flow.");
    resetAll();
  };

  /* ---------------- step 1: current password ---------------- */
  const continueFromCurrent = async () => {
    setError("");
    if (!current) return setError("Enter your current password.");
    if (!email) return setError("No registered email found for this account.");
    if (!verifyCurrentPassword(email, current)) {
      setError("Current password is incorrect.");
      audit("Password Change Failed", portal, "Incorrect current password.");
      return;
    }
    setBusy(true);
    await sendPasswordOtp(email);
    setBusy(false);
    setCode("");
    setOtpError("");
    setLocked(false);
    setAttemptsLeft(OTP_MAX_ATTEMPTS);
    setSeconds(OTP_RESEND_SECONDS);
    setStep("otp");
    toast.success("Verification code sent", {
      description: `We emailed a 6-digit code to ${email}.`,
    });
  };

  /* ---------------- step 2: OTP ---------------- */
  const submitOtp = async (value: string) => {
    if (busy || locked || value.length !== OTP_LENGTH) return;
    setBusy(true);
    setOtpError("");
    const res = await verifyPasswordOtp(email, value);
    setBusy(false);
    if (res.ok) {
      toast.success("Identity verified");
      setStep("new");
      return;
    }
    setCode("");
    setAttemptsLeft(res.attemptsLeft);
    if (res.reason === "locked") {
      setLocked(true);
      setOtpError("Too many incorrect attempts. Please request a new OTP.");
      audit("Password Change Failed", portal, "Too many incorrect OTP attempts.");
    } else if (res.reason === "expired" || res.reason === "no_code") {
      setOtpError("This verification code has expired. Please request a new one.");
      audit("Password Change Failed", portal, "OTP expired.");
    } else {
      setOtpError(
        `Incorrect verification code. ${res.attemptsLeft} attempt${res.attemptsLeft === 1 ? "" : "s"} remaining.`,
      );
      audit("Password Change Failed", portal, "Incorrect OTP entered.");
    }
  };

  const resend = async () => {
    if (seconds > 0 || resending) return;
    setResending(true);
    await sendPasswordOtp(email);
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
    await sendPasswordChangedEmail(email);
    setBusy(false);
    audit("Password Changed", portal, "Password updated after email OTP verification. Status: Success");
    setStep("done");
    toast.success("Password changed successfully", {
      description: "Please sign in again with your new password.",
    });
    setTimeout(() => {
      logout();
      void navigate({ to: "/login" });
    }, 2600);
  };

  /* ---------------- render ---------------- */
  const description =
    step === "current"
      ? "Verify your current password to receive a one-time code on your registered email."
      : step === "otp"
        ? "Enter the 6-digit verification code we emailed you."
        : step === "new"
          ? "Identity verified. Create your new password."
          : "Your password has been updated.";

  if (recovery) {
    return (
      <Wrapper
        title="Reset password"
        description="Recover access with a one-time code sent to your registered email."
      >
        <PasswordRecovery
          lockedEmail={email}
          actor={{ name: user?.name, code: user?.code }}
          onCancel={() => setRecovery(false)}
          onFinish={() => {
            logout();
            void navigate({ to: "/login" });
          }}
        />
      </Wrapper>
    );
  }

  return (
    <Wrapper
      title="Change password"
      description={description}
      actions={
        step === "current" ? (
          <Button
            className="rounded-md"
            onClick={() => void continueFromCurrent()}
            disabled={busy}
          >
            <Key className="mr-1.5 h-4 w-4" />
            {busy ? "Sending code…" : "Continue"}
          </Button>
        ) : undefined
      }
    >
      {/* Step 1 */}
      {step === "current" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Current password</Label>
            <PasswordInput
              value={current}
              onChange={setCurrent}
              autoComplete="current-password"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setRecovery(true)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot current password?
            </button>
          </div>


          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-start gap-2 rounded-md border border-border/60 bg-card/40 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              A verification code will be sent to{" "}
              <span className="font-medium text-foreground">
                {email || "your registered email"}
              </span>
              .
            </span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="h-11 rounded-md sm:w-auto"
              onClick={() => void continueFromCurrent()}
              disabled={busy}
            >
              {busy ? "Sending code…" : "Continue"}
            </Button>
            <Button
              variant="ghost"
              className="h-11 rounded-md text-muted-foreground sm:w-auto"
              onClick={() => cancel(false)}
              disabled={busy}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === "otp" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <h3 className="font-display text-lg">Verify your identity</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            A 6-digit verification code has been sent to your registered email address.
          </p>

          <div className="mt-4 flex items-center gap-3 rounded-md border border-border/60 bg-card/50 p-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border/60 bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Registered email
              </div>
              <div className="truncate text-sm font-medium">{email}</div>
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
            {busy ? "Verifying…" : (
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
              onClick={() => cancel()}
              className="h-11 rounded-md text-sm text-muted-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === "new" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="space-y-1.5">
            <Label>New password</Label>
            <PasswordInput value={next} onChange={setNext} placeholder="Enter a new password" />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm new password</Label>
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

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="h-11 rounded-md sm:w-auto"
              onClick={() => void savePassword()}
              disabled={busy}
            >
              {busy ? "Updating…" : "Update password"}
            </Button>
            <Button
              variant="ghost"
              className="h-11 rounded-md text-muted-foreground sm:w-auto"
              onClick={() => cancel()}
              disabled={busy}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Success */}
      {step === "done" && (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border/60 bg-card/40 px-4 py-8 text-center animate-in fade-in zoom-in-95">
          <div className="grid h-12 w-12 place-items-center rounded-md border border-primary/30 bg-primary/10 text-primary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="font-display text-lg">Password changed successfully</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Your password has been updated. For security reasons, you will need to log in again.
          </p>
          <p className="text-xs text-muted-foreground">Signing you out…</p>
        </div>
      )}
    </Wrapper>
  );
}
