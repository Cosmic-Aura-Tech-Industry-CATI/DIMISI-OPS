import { createFileRoute, Outlet, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageSpinner } from "@/components/loading";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  errorComponent: AdminErrorComponent,
});

function AdminErrorComponent({ error, reset }: { error: any; reset: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleRetry = () => {
    try {
      queryClient.resetQueries();
    } catch {}
    router.invalidate();
    reset();
  };

  return (
    <DashboardShell role="admin">
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="glass max-w-lg w-full rounded-3xl border border-destructive/20 p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-destructive/15 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
            Something went wrong loading this section
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {error?.message || "An unexpected error occurred while rendering this page. You can try refreshing the data or head back to the admin overview."}
          </p>

          {import.meta.env.DEV && error?.stack && (
            <div className="mt-4 max-h-40 overflow-auto rounded-xl bg-destructive/10 p-3 text-left text-xs text-destructive font-mono">
              <pre className="whitespace-pre-wrap">{error.stack}</pre>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={handleRetry} className="gap-2 rounded-full shadow-glow">
              <RotateCcw className="h-4 w-4" /> Try again
            </Button>
            <Button variant="outline" asChild className="gap-2 rounded-full">
              <Link to="/admin">
                <Home className="h-4 w-4" /> Admin overview
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const role = String(user?.role || "").trim().toLowerCase();
  const isAdminOrDirector = role === "admin" || role === "director";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", replace: true });
    } else if (!isAdminOrDirector) {
      navigate({ to: "/employee", replace: true });
    }
  }, [user, loading, isAdminOrDirector, navigate]);

  if (loading || !user || !isAdminOrDirector) return <PageSpinner />;

  return (
    <DashboardShell role="admin">
      <Outlet />
    </DashboardShell>
  );
}
