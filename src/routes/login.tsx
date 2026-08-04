import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, User, ArrowRight, Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAuth, type Role, type AuthUser } from "@/lib/auth";
import { rememberSignInPassword, verifyCredentials } from "@/lib/accounts";
import { logAudit } from "@/lib/audit-log";
import { sendOtp } from "@/lib/otp";
import { OtpVerification } from "@/components/otp-verification";

interface PendingLogin {
  role: Role;
  user: AuthUser;
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthShell } from "@/components/auth-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Poll" },
      { name: "description", content: "Sign in to Poll to access your task management dashboard." },
      { property: "og:title", content: "Sign in — Poll" },
      { property: "og:description", content: "Sign in to Poll to access your task management dashboard." },
    ],
  }),
  component: LoginPage,
});

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function LoginPage() {
  const { signInWith, user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("employee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState<PendingLogin | null>(null);

  useEffect(() => {
    if (user) navigate({ to: user.role === "admin" ? "/admin" : "/employee" });
  }, [user, navigate]);

  const emailError = touched.email && !validateEmail(email) ? "Please enter a valid work email." : "";
  const pwError = touched.password && password.length < 6 ? "Password must be at least 6 characters." : "";
  const canSubmit = validateEmail(email) && password.length >= 6 && !submitting;

  const messages: Record<string, string> = {
    unknown_email: "No account found with this email address.",
    wrong_role: `This account is not registered on the ${role === "admin" ? "Admin" : "Employee"} Portal. Switch the role and try again.`,
    wrong_password: "Incorrect password. Please try again.",
    inactive: "This account is inactive. Contact an administrator.",
  };

  const logLoginFailure = (reason: string, actorName?: string, actorId?: string) =>
    logAudit({
      category: "authentication",
      action: "Login attempt",
      target: role === "admin" ? "Admin portal" : "Employee portal",
      details: `Failed login for ${email.trim()} — ${reason}.`,
      status: "failed",
      actorName: actorName ?? email.trim(),
      actorId: actorId ?? "UNKNOWN",
    });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setFormError("");
    if (!canSubmit) return;
    setSubmitting(true);
    setTimeout(() => {
      void (async () => {
        const result = verifyCredentials(role, email, password);
        if (!result.ok) {
          setSubmitting(false);
          setFormError(messages[result.reason]);
          logLoginFailure(
            result.reason === "wrong_password" ? "Invalid Password" : messages[result.reason],
          );
          return;
        }
        const c = result.credential;
        // Remember what the user typed so Settings can validate it later.
        rememberSignInPassword(c.email, password);
        // Credentials are valid — issue the mandatory second factor.
        await sendOtp(c.email);

        setSubmitting(false);
        setPending({
          role,
          user: { id: c.id, code: c.code, name: c.name, email: c.email, role, avatar: c.avatar },
        });
      })();
    }, 500);
  };

  const onVerified = () => {
    if (!pending) return;
    const u = pending.user;
    signInWith(u);
    logAudit({
      category: "authentication",
      action: "Login verified (OTP)",
      target: pending.role === "admin" ? "Admin portal" : "Employee portal",
      details: `Two-step verification completed for ${u.email}.`,
      status: "success",
      actorName: u.name,
      actorId: u.code,
    });
    toast.success(`Welcome back, ${u.name.split(" ")[0]}!`);
    navigate({ to: pending.role === "admin" ? "/admin" : "/employee" });
  };

  if (pending) {
    return (
      <AuthShell
        title="Verify your identity"
        subtitle="We've sent a 6-digit verification code to your registered email address."
      >
        <OtpVerification
          email={pending.user.email}
          onVerified={onVerified}
          onBack={() => setPending(null)}
          onFailure={(reason) => logLoginFailure(reason, pending.user.name, pending.user.code)}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your workspace."
    >

      <form onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { id: "admin", label: "Admin", icon: ShieldCheck, desc: "Full control" },
              { id: "employee", label: "Employee", icon: User, desc: "Personal workspace" },
            ] as const
          ).map((r) => {
            const selected = role === r.id;
            return (
              <button
                type="button"
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`group rounded-2xl border p-4 text-left transition-all ${
                  selected
                    ? "border-primary bg-primary/10 shadow-glow"
                    : "border-border/60 bg-background/40 hover:border-primary/40 hover:-translate-y-0.5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <r.icon className={`h-5 w-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                  {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <div className="mt-2 text-sm font-semibold">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Work email</Label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                aria-invalid={!!emailError}
                className={`h-11 rounded-xl pl-9 ${emailError ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
              />
            </div>
            {emailError && <p className="mt-1.5 text-xs text-destructive">{emailError}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
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
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
            Keep me signed in on this device
          </label>
        </div>

        {formError && (
          <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" disabled={!canSubmit} className="mt-6 h-11 w-full rounded-md text-sm shadow-glow">
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Signing in…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Continue as {role} <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Open access is on — any email and password (6+ characters) signs you into the selected
          portal.
        </p>
      </form>
    </AuthShell>
  );
}

// Re-export ThemeToggle to keep imports simple where needed
export { ThemeToggle };
