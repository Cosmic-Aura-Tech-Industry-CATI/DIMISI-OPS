import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageSpinner } from "@/components/loading";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (user.role !== "admin") navigate({ to: "/employee" });
  }, [user, loading, navigate]);

  if (loading || !user || user.role !== "admin") return <PageSpinner />;

  return (
    <DashboardShell role="admin">
      <Outlet />
    </DashboardShell>
  );
}
