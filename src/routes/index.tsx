import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { PageSpinner } from "@/components/loading";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else {
      const isAdminOrDirector = user.role === "admin" || user.role === "director";
      navigate({ to: isAdminOrDirector ? "/admin" : "/employee" });
    }
  }, [user, loading, navigate]);

  return <PageSpinner />;
}
