import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { PageSpinner } from "@/components/loading";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", replace: true });
    } else {
      const role = String(user.role || "").trim().toLowerCase();
      if (role === "admin" || role === "director") {
        navigate({ to: "/admin", replace: true });
      } else {
        navigate({ to: "/employee", replace: true });
      }
    }
  }, [user, loading, navigate]);

  return <PageSpinner />;
}
