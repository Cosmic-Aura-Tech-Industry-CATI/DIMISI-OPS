import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mail, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_SECONDS,
  clearOtp,
  sendOtp,
  verifyOtp,
} from "@/lib/otp";
import { toast } from "sonner";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function OtpVerification({
  email,
  onVerified,
  onBack,
  onFailure,
}: {
  email: string;
  onVerified: () => void;
  onBack: () => void;
  /** Reported for audit logging: "Invalid OTP" | "OTP Expired" | "OTP Locked" */
  onFailure?: (reason: string) => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(OTP_MAX_ATTEMPTS);
  const [seconds, setSeconds] = useState(OTP_RESEND_SECONDS);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const submit = async (value: string) => {
    if (busy || locked || value.length !== OTP_LENGTH) return;
    setBusy(true);
    setError("");
    const res = await verifyOtp(email, value);
    setBusy(false);
    if (res.ok) {
      toast.success("Authentication successful");
      onVerified();
      return;
    }
    setCode("");
    setAttemptsLeft(res.attemptsLeft);
    if (res.reason === "locked") {
      setLocked(true);
      setError("Too many incorrect attempts. Please request a new OTP.");
      onFailure?.("Invalid OTP");
    } else if (res.reason === "expired" || res.reason === "no_code") {
      setError("This verification code has expired. Please request a new one.");
      onFailure?.("OTP Expired");
    } else {
      setError(
        `Incorrect verification code. ${res.attemptsLeft} attempt${res.attemptsLeft === 1 ? "" : "s"} remaining.`,
      );
      onFailure?.("Invalid OTP");
    }
  };

  const resend = async () => {
    if (seconds > 0 || resending) return;
    setResending(true);
    await sendOtp(email);
    setResending(false);
    setCode("");
    setError("");
    setLocked(false);
    setAttemptsLeft(OTP_MAX_ATTEMPTS);
    setSeconds(OTP_RESEND_SECONDS);
    toast.success("A new verification code has been sent to your email.");
  };

  const back = () => {
    clearOtp(email);
    onBack();
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 rounded-md border border-border/60 bg-card/50 p-3">
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
            if (v.length === OTP_LENGTH) void submit(v);
          }}
          disabled={busy || locked}
          containerClassName="justify-between gap-1.5 sm:gap-2"
        >
          <InputOTPGroup className="grid w-full grid-cols-6 gap-1.5 sm:gap-2">
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="h-12 w-full rounded-md border border-border/60 bg-background/60 text-base font-semibold transition-colors first:rounded-md last:rounded-md sm:h-14 sm:text-lg"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          The code expires in 5 minutes. {attemptsLeft} of {OTP_MAX_ATTEMPTS} attempts remaining.
        </p>
      )}

      <Button
        type="button"
        onClick={() => void submit(code)}
        disabled={busy || locked || code.length !== OTP_LENGTH}
        className="mt-6 h-11 w-full rounded-md text-sm shadow-glow"
      >
        {busy ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Verifying…
          </span>
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
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
        </Button>
      </div>
    </div>
  );
}
