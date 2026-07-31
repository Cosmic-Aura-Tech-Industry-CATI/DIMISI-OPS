import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Poll" },
      { name: "description", content: "Choose a new password for your Poll account." },
      { property: "og:title", content: "Reset password — Poll" },
      { property: "og:description", content: "Choose a new password for your Poll account." },
    ],
  }),
  component: ResetPasswordPage,
});

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0..4
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState({ pw: false, confirm: false });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const score = useMemo(() => scorePassword(pw), [pw]);
  const strengthLabel = ["Too weak", "Weak", "Fair", "Strong", "Excellent"][score];
  const strengthColor = [
    "bg-destructive",
    "bg-destructive",
    "bg-warning",
    "bg-success",
    "bg-success",
  ][score];

  const pwError =
    touched.pw && pw.length < 8 ? "Use at least 8 characters." : "";
  const confirmError =
    touched.confirm && confirm !== pw ? "Passwords do not match." : "";

  const canSubmit = pw.length >= 8 && confirm === pw && score >= 2 && !submitting;

  const rules = [
    { label: "At least 8 characters", ok: pw.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(pw) },
    { label: "One number", ok: /[0-9]/.test(pw) },
    { label: "One symbol", ok: /[^A-Za-z0-9]/.test(pw) },
  ];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ pw: true, confirm: true });
    if (!canSubmit) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
      toast.success("Password updated successfully");
    }, 800);
  };

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="Your password has been changed successfully.">
        <div className="space-y-5">
          <div className="glass flex items-start gap-3 rounded-2xl p-4">
            <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-success/15 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="text-sm">
              <div className="font-semibold">All set</div>
              <p className="mt-1 text-muted-foreground">
                You can now sign in with your new password.
              </p>
            </div>
          </div>
          <Button
            className="h-11 w-full rounded-full shadow-glow"
            onClick={() => navigate({ to: "/login" })}
          >
            Continue to sign in <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password you haven't used before."
      footer={
        <span className="text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div>
          <Label htmlFor="pw">New password</Label>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="pw"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, pw: true }))}
              aria-invalid={!!pwError}
              className={`h-11 rounded-xl pl-9 pr-10 ${pwError ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {pwError && <p className="mt-1.5 text-xs text-destructive">{pwError}</p>}

          {pw.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < score ? strengthColor : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <ShieldCheck className="h-3 w-3" /> Strength
                </span>
                <span className="font-medium">{strengthLabel}</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              aria-invalid={!!confirmError}
              className={`h-11 rounded-xl pl-9 ${confirmError ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
            />
          </div>
          {confirmError && <p className="mt-1.5 text-xs text-destructive">{confirmError}</p>}
        </div>

        <ul className="grid grid-cols-2 gap-2 text-xs">
          {rules.map((r) => (
            <li
              key={r.label}
              className={`flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/40 px-2.5 py-1.5 ${
                r.ok ? "text-success" : "text-muted-foreground"
              }`}
            >
              <CheckCircle2 className={`h-3.5 w-3.5 ${r.ok ? "opacity-100" : "opacity-40"}`} />
              {r.label}
            </li>
          ))}
        </ul>

        <Button type="submit" disabled={!canSubmit} className="h-11 w-full rounded-md text-sm shadow-glow">
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Updating…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Update password <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
