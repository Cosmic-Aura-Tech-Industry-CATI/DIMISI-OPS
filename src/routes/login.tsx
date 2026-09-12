import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, User, ArrowRight, Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAuth, normalizeUser, type Role, type AuthUser } from "@/lib/auth";
import { rememberSignInPassword, verifyCredentials } from "@/lib/accounts";
import { logAudit } from "@/lib/audit-log";
import { sendOtp } from "@/lib/otp";
import { OtpVerification } from "@/components/otp-verification";
import { signInWithGoogleOAuth } from "@/lib/firebase";

import { authService } from "@/auth/services/auth.service";

interface PendingLogin {
  email: string;
  role: Role;
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
  const { user, signInWith } = useAuth();
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
    if (user) {
      const isAdminOrDirector = user.role === "admin" || user.role === "director";
      navigate({ to: isAdminOrDirector ? "/admin" : "/employee" });
    }
  }, [user, navigate]);

  const cleanEmail = email.trim().toLowerCase();
  const emailError = touched.email && !validateEmail(cleanEmail) ? "Please enter a valid work email." : "";
  const pwError = touched.password && password.length < 6 ? "Password must be at least 6 characters." : "";
  const canSubmit = validateEmail(cleanEmail) && password.length >= 6 && !submitting;

  const logLoginFailure = (reason: string) =>
    logAudit({
      category: "authentication",
      action: "Login attempt",
      target: role === "admin" ? "Admin portal" : "Employee portal",
      details: `Failed login for ${cleanEmail} — ${reason}.`,
      status: "failed",
      actorName: cleanEmail,
      actorId: "UNKNOWN",
    });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setFormError("");
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      const res = await authService.login({
        email: cleanEmail,
        password,
      });

      setSubmitting(false);
      const successMessage = res?.message || "OTP sent successfully to your registered email.";
      toast.success(successMessage);
      setPending({
        email: cleanEmail,
        role,
      });
    } catch (err: any) {
      setSubmitting(false);
      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Login failed. Please check your email & password and try again.";
      setFormError(message);
      logLoginFailure(message);
      toast.error(message);
    }
  };

  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const onGoogleSignIn = async () => {
    setFormError("");
    setGoogleSubmitting(true);
    try {
      const { idToken } = await signInWithGoogleOAuth();
      const res = await authService.oauthLogin({ idToken });
      const authUserData = res?.data?.user || res?.user;
      if (!authUserData) {
        throw new Error("Failed to receive profile information from server.");
      }
      const normalized = normalizeUser(authUserData);
      signInWith(normalized);
      toast.success(`Welcome back, ${normalized.name?.split(" ")[0] || "User"}!`);
      const isAdminOrDirector = normalized.role === "admin" || normalized.role === "director";
      navigate({ to: isAdminOrDirector ? "/admin" : "/employee" });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Google sign-in failed. Please try again.";
      setFormError(message);
      logLoginFailure(message);
      toast.error(message);
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const onVerified = (verifiedUser?: AuthUser) => {
    if (!pending) return;
    const dbRole = verifiedUser?.role || pending.role;
    const isAdminOrDirector = dbRole === "admin" || dbRole === "director";
    toast.success(`Welcome back, ${verifiedUser?.name?.split(" ")[0] || "User"}!`);
    navigate({ to: isAdminOrDirector ? "/admin" : "/employee" });
  };

  if (pending) {
    return (
      <AuthShell
        title="Verify your identity"
        subtitle="We've sent a 6-digit verification code to your registered email address."
      >
        <OtpVerification
          email={pending.email}
          onVerified={onVerified}
          onBack={() => setPending(null)}
          onFailure={(reason) => logLoginFailure(reason)}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your workspace."
    >
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={onGoogleSignIn}
          disabled={googleSubmitting || submitting}
          className="h-11 w-full rounded-xl border-border/80 bg-background/50 font-medium transition-all hover:bg-accent hover:border-primary/40"
        >
          {googleSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Connecting to Google…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2.5">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign in with Google SSO
            </span>
          )}
        </Button>

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <span className="relative bg-card px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            or continue with credentials
          </span>
        </div>
      </div>

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
                className={`group rounded-2xl border p-4 text-left transition-all ${selected
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

        <Button type="submit" disabled={!canSubmit || googleSubmitting} className="mt-6 h-11 w-full rounded-md text-sm shadow-glow">
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
          Database verification active — enter your registered work email & password (8+ characters) to sign in.
        </p>
      </form>
    </AuthShell>
  );
}

// Re-export ThemeToggle to keep imports simple where needed
export { ThemeToggle };
