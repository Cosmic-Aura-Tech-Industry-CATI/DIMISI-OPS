import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Key,
  Mail,
  Pencil,
  Shield,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { IdBadge } from "@/components/id-badge";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { activityLogs, admins, employeeAccountFor } from "@/lib/mock-data";
import { UserX } from "lucide-react";

export const Route = createFileRoute("/admin/admins/$id")({
  head: () => ({ meta: [{ title: "Admin details — Poll" }] }),
  component: AdminDetailPage,
});



const defaultPerms = ["Manage employees", "Manage tasks", "Review submissions", "Award points", "View reports"];

function AdminDetailPage() {
  const { id } = useParams({ from: "/admin/admins/$id" });
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const person = admins.find((a) => a.id === id);

  if (!person) {
    return (
      <EmptyState
        icon={UserX}
        title="Admin not found"
        description="This administrator may have been revoked."
        action={<Button asChild><Link to="/admin/admins">Back to list</Link></Button>}
      />
    );
  }

  const history = activityLogs.filter((a) => a.user === person.name).slice(0, 5);

  return (
    <>
      <div>
        <Link to="/admin/admins" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to admins
        </Link>
      </div>

      <PageHeader
        title={person.name}
        subtitle={`${person.permanent ? "Permanent director" : "Administrator"} · ${person.code}`}
        actions={
          <>
            <Button asChild variant="outline" className="rounded-md">
              <Link to="/admin/admins/$id/edit" params={{ id: person.id }}>
                <Pencil className="mr-1.5 h-4 w-4" /> Edit
              </Link>
            </Button>
            {!person.permanent && (
              <Button variant="destructive" className="rounded-md" onClick={() => setConfirmDelete(true)}>
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
              {person.avatar}
            </div>
            <p className="mt-4 font-display text-lg font-semibold">{person.name}</p>
            <div className="mt-1"><IdBadge id={person.code} /></div>
            {employeeAccountFor(person.name) && (
              <Link
                to="/admin/employees/$id"
                params={{ id: employeeAccountFor(person.name)!.id }}
                className="mt-2 text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                Also an employee — view employee account ({employeeAccountFor(person.name)!.code})
              </Link>
            )}
            <p className="mt-1 text-xs text-muted-foreground">{person.email}</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full bg-primary/15 text-primary">
                <ShieldCheck className="mr-1 h-3 w-3" /> Admin
              </Badge>
              <span className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium ${person.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" /> {person.status}
              </span>
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <Row icon={Building2} label="Department" value={person.department} />
            <Row icon={Mail} label="Email" value={person.email} />
            <Row icon={CalendarDays} label="Added" value={new Date(person.joinedAt).toLocaleDateString(undefined, { dateStyle: "long" })} />
            <Row icon={Shield} label="Admin ID" value={person.code} mono />
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
                <div key={p} className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 p-3 text-sm">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-success/15 text-success">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                  {p}
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold">Recent activity</h3>
            <ul className="mt-3 space-y-3">
              {history.length === 0 && <li className="text-xs text-muted-foreground">No recent activity.</li>}
              {history.map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p><span className="text-muted-foreground">{a.action}</span> <span className="font-medium">{a.target}</span></p>
                    <p className="text-xs text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke {person.name}?</AlertDialogTitle>
            <AlertDialogDescription>They will lose admin privileges immediately. You can re-invite them later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                toast.success(`${person.name} removed`);
                navigate({ to: "/admin/admins" });
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Row({ icon: Icon, label, value, mono }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </dt>
      <dd className={`truncate text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
