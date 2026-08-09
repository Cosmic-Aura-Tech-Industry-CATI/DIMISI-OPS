import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageSpinner } from "@/components/loading";

export const Route = createFileRoute("/employee")({
  component: EmployeeLayout,
});

function EmployeeLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (user.role !== "employee" && user.role !== "intern") navigate({ to: "/admin" });
  }, [user, loading, navigate]);

  if (loading || !user || (user.role !== "employee" && user.role !== "intern")) return <PageSpinner />;

  return (
    <DashboardShell role="employee">
      <Outlet />
    </DashboardShell>
  );
}
