import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save, UserX } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { admins } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/admins/$id/edit")({
  head: () => ({ meta: [{ title: "Edit admin — Poll" }] }),
  component: EditAdminPage,
});

const departments = ["Operations", "People", "Engineering", "Design", "Product", "Finance", "Legal"];
const permissions = [
  { id: "manage_employees", label: "Manage employees" },
  { id: "manage_tasks", label: "Manage tasks" },
  { id: "review_tasks", label: "Review submissions" },
  { id: "award_points", label: "Award reward points" },
  { id: "view_reports", label: "View reports & analytics" },
  { id: "manage_admins", label: "Manage other admins" },
];

function EditAdminPage() {
  const { id } = useParams({ from: "/admin/admins/$id/edit" });
  const navigate = useNavigate();
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

  const [form, setForm] = useState({
    name: person.name,
    email: person.email,
    department: person.department,
    active: person.status === "active",
    perms: ["manage_employees", "manage_tasks", "review_tasks", "award_points", "view_reports"] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const togglePerm = (pid: string, on: boolean) =>
    setForm({ ...form, perms: on ? [...form.perms, pid] : form.perms.filter((p) => p !== pid) });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    toast.success("Admin updated", { description: `${form.name}'s profile saved (mock).` });
    navigate({ to: "/admin/admins/$id", params: { id: person.id } });
  };

  return (
    <>
      <div>
        <Link to="/admin/admins/$id" params={{ id: person.id }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to details
        </Link>
      </div>
      <PageHeader title={`Edit ${person.name}`} subtitle="Update profile, permissions, and access." />

      <form onSubmit={submit} className="glass max-w-2xl space-y-5 rounded-2xl p-6">
        <Field label="Full name" error={errors.name}>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Work email" error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Department">
          <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </Field>

        <div>
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Permissions</Label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {permissions.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/40 p-3 text-sm cursor-pointer hover:bg-secondary/40">
                <Checkbox checked={form.perms.includes(p.id)} onCheckedChange={(v) => togglePerm(p.id, !!v)} />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 p-4">
          <div>
            <p className="text-sm font-medium">Account active</p>
            <p className="text-xs text-muted-foreground">Inactive admins can't sign in.</p>
          </div>
          <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" className="rounded-md" onClick={() => navigate({ to: "/admin/admins/$id", params: { id: person.id } })}>Cancel</Button>
          <Button type="submit" className="rounded-md shadow-glow"><Save className="mr-1.5 h-4 w-4" /> Save changes</Button>
        </div>
      </form>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
