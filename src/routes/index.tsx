import { createFileRoute, redirect, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
  component: () => <Navigate to="/admin" replace />,
});

