import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { admins, employees } from "@/lib/mock-data";
import { EmptyState } from "@/components/empty-state";
import { UserX } from "lucide-react";

export const Route = createFileRoute("/admin/employees/$id/edit")({
  head: () => ({ meta: [{ title: "Edit employee — Poll" }] }),
  component: EditEmployeePage,
});

const departments = ["Engineering", "Design", "Marketing", "Sales", "Support", "Product", "Operations", "People"];

function EditEmployeePage() {
  const { id } = useParams({ from: "/admin/employees/$id/edit" });
  const navigate = useNavigate();
  const person = [...employees, ...admins].find((e) => e.id === id);

  if (!person) {
    return (
      <EmptyState
        icon={UserX}
        title="Employee not found"
        description="This person may have been removed."
        action={<Button asChild><Link to="/admin/employees">Back to list</Link></Button>}
      />
    );
  }

  const [form, setForm] = useState({
    name: person.name,
    email: person.email,
    department: person.department,
    role: person.role,
    active: person.status === "active",
    points: person.points,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    toast.success("Changes saved", { description: `${form.name}'s profile updated (mock).` });
    navigate({ to: "/admin/employees/$id", params: { id: person.id } });
  };

  return (
    <>
      <div>
        <Link to="/admin/employees/$id" params={{ id: person.id }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to details
        </Link>
      </div>
      <PageHeader title={`Edit ${person.name}`} subtitle="Update profile, role, and access." />

      <form onSubmit={submit} className="glass max-w-2xl space-y-5 rounded-2xl p-6">
        <Field label="Full name" error={errors.name}>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Work email" error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Department">
            <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Role">
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "admin" | "employee" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Reward points">
          <Input type="number" min={0} value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 p-4">
          <div>
            <p className="text-sm font-medium">Account active</p>
            <p className="text-xs text-muted-foreground">Inactive users can't sign in.</p>
          </div>
          <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" className="rounded-md" onClick={() => navigate({ to: "/admin/employees/$id", params: { id: person.id } })}>Cancel</Button>
          <Button type="submit" className="rounded-md shadow-glow">
            <Save className="mr-1.5 h-4 w-4" /> Save changes
          </Button>
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
