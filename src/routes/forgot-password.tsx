import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — Poll" },
      { name: "description", content: "Reset your Poll account password securely." },
      { property: "og:title", content: "Forgot password — Poll" },
      { property: "og:description", content: "Reset your Poll account password securely." },
    ],
  }),
  component: ForgotPasswordPage,
});

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const emailError = touched && !validateEmail(email) ? "Please enter a valid email address." : "";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!validateEmail(email)) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
    }, 800);
  };

  return (
    <AuthShell
      title={sent ? "Check your inbox" : "Forgot your password?"}
      subtitle={
        sent
          ? "We sent a password reset link to your email. It expires in 30 minutes."
          : "Enter the email associated with your account and we'll send you a reset link."
      }
      footer={
        <span className="text-muted-foreground">
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </span>
      }
    >
      {sent ? (
        <div className="space-y-5">
          <div className="glass flex items-start gap-3 rounded-2xl p-4">
            <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-success/15 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="text-sm">
              <div className="font-semibold">Email sent to {email}</div>
              <p className="mt-1 text-muted-foreground">
                Click the link in the email to set a new password. Didn't get it? Check spam or try again.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-full"
              onClick={() => {
                setSent(false);
                setTouched(false);
              }}
            >
              Use a different email
            </Button>
            <Button
              type="button"
              className="h-11 flex-1 rounded-full shadow-glow"
              onClick={() => navigate({ to: "/reset-password" })}
            >
              Open reset page <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <div>
            <Label htmlFor="email">Email address</Label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                aria-invalid={!!emailError}
                className={`h-11 rounded-xl pl-9 ${emailError ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
              />
            </div>
            {emailError && <p className="mt-1.5 text-xs text-destructive">{emailError}</p>}
          </div>

          <Button type="submit" disabled={submitting} className="h-11 w-full rounded-md text-sm shadow-glow">
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Sending link…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Send reset link <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <Link
            to="/login"
            className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Back to sign in
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
