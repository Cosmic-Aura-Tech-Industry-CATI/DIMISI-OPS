import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { PasswordRecovery } from "@/components/password-recovery";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — Dimisi" },
      { name: "description", content: "Recover your Dimisi account password with email OTP verification." },
      { property: "og:title", content: "Forgot password — Dimisi" },
      { property: "og:description", content: "Recover your Dimisi account password with email OTP verification." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <AuthShell
      title="Password recovery"
      subtitle="Verify your registered email, confirm the one-time code, and set a new password."
      footer={
        <span className="text-muted-foreground">
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </span>
      }
    >
      <PasswordRecovery
        onCancel={() => void navigate({ to: "/login" })}
        onFinish={() => {
          logout();
          void navigate({ to: "/login" });
        }}
      />
    </AuthShell>
  );
}
