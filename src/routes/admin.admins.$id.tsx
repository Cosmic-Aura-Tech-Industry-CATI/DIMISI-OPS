import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Key,
  Loader2,
  Mail,
  Pencil,
  Shield,
  ShieldCheck,
  Trash2,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { IdBadge } from "@/components/id-badge";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/empty-state";
import { useAdminDetailsQuery, useRevokeAdminAccess } from "@/features/admins";

export const Route = createFileRoute("/admin/admins/$id")({
  head: () => ({ meta: [{ title: "Admin details — Dimisi" }] }),
  component: AdminDetailPage,
});

const defaultPerms = [
  "Manage employees",
  "Manage tasks",
  "Review submissions",
  "Award points",
  "View reports",
];

function initials(name: string) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function AdminDetailPage() {
  const { id } = useParams({ from: "/admin/admins/$id" });
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: user, isLoading, isError, error } = useAdminDetailsQuery(id);
  const revokeMutation = useRevokeAdminAccess();

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-48 rounded-md" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <EmptyState
        icon={UserX}
        title="Admin not found"
        description={error?.message || "This administrator may have been revoked or does not exist."}
        action={
          <Button asChild>
            <Link to="/admin/admins">Back to list</Link>
          </Button>
        }
      />
    );
  }

  const userId = user._id || user.id || id;
  const deptName =
    typeof user.department === "object" && user.department
      ? (user.department as { name?: string }).name || "General"
      : (user.department as string) || "General";

  const titleName =
    typeof user.designation === "object" && user.designation
      ? (user.designation as { name?: string }).name || "Admin"
      : (user.designation as string) || "Admin";

  const empCode = user.empId || "—";
  const isDirector = String(user.role || "").toLowerCase() === "director";

  const handleRevoke = () => {
    revokeMutation.mutate(userId, {
      onSuccess: () => {
        toast.success(`Access revoked for ${user.name}`);
        setConfirmDelete(false);
        navigate({ to: "/admin/admins" });
      },
      onError: (err) => {
        toast.error(err.message || "Failed to revoke admin access");
      },
    });
  };

  return (
    <>
      <div>
        <Link
          to="/admin/admins"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to admins
        </Link>
      </div>

      <PageHeader
        title={user.name}
        subtitle={`${isDirector ? "Permanent director" : "Administrator"} · ${empCode}`}
        actions={
          <>
            <Button asChild variant="outline" className="rounded-md">
              <Link to="/admin/admins/$id/edit" params={{ id: userId }}>
                <Pencil className="mr-1.5 h-4 w-4" /> Edit
              </Link>
            </Button>
            {!isDirector && (
              <Button
                variant="destructive"
                className="rounded-md"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Revoke
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-2xl font-bold text-primary-foreground shadow-glow">
              {initials(user.name)}
            </div>
            <p className="mt-4 font-display text-lg font-semibold">{user.name}</p>
            <div className="mt-1">
              <IdBadge id={empCode} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full bg-primary/15 text-primary">
                <ShieldCheck className="mr-1 h-3 w-3" /> {isDirector ? "Director" : "Admin"}
              </Badge>
              <span
                className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium ${
                  user.isActive ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <Row icon={Building2} label="Department" value={deptName} />
            <Row icon={Mail} label="Email" value={user.email} />
            <Row
              icon={CalendarDays}
              label="Added"
              value={new Date(user.joinDate || user.createdAt || Date.now()).toLocaleDateString(
                undefined,
                { dateStyle: "long" },
              )}
            />
            <Row icon={Shield} label="Admin ID" value={empCode} mono />
          </dl>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <h3 className="font-display text-lg font-semibold">Permissions</h3>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {defaultPerms.map((p) => (
                <div
                  key={p}
                  className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 p-3 text-sm"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-success/15 text-success">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will lose admin privileges immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRevoke}
              disabled={revokeMutation.isPending}
            >
              {revokeMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Revoking...
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-4 w-4" /> Revoke
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </dt>
      <dd className={`truncate text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
