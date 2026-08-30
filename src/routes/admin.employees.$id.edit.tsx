import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Save, UserX } from "lucide-react";
import { toast } from "sonner";
import { useDepartmentsQuery } from "@/features/departments";
import { useEmployeeDetailsQuery, useUpdateEmployeeDetails } from "@/features/employees";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/admin/employees/$id/edit")({
  head: () => ({ meta: [{ title: "Edit employee — Dimisi" }] }),
  component: EditEmployeePage,
});

function EditEmployeePage() {
  const { id } = useParams({ from: "/admin/employees/$id/edit" });
  const navigate = useNavigate();

  const { data: user, isLoading, isError, error } = useEmployeeDetailsQuery(id);
  const { data: departments = [] } = useDepartmentsQuery();
  const updateMutation = useUpdateEmployeeDetails();

  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    active: true,
    points: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      const deptId =
        typeof user.department === "object" && user.department
          ? (user.department as { _id?: string })._id || ""
          : (user.department as string) || "";

      setForm({
        name: user.name || "",
        email: user.email || "",
        department: deptId,
        active: Boolean(user.isActive),
        points: user.points ?? 0,
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4 p-6">
        <Skeleton className="h-10 w-48 rounded-md" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <EmptyState
        icon={UserX}
        title="Employee not found"
        description={error?.message || "This employee could not be found."}
        action={
          <Button asChild>
            <Link to="/admin/employees">Back to list</Link>
          </Button>
        }
      />
    );
  }

  const userId = user._id || id;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = "Enter a valid email";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    updateMutation.mutate(
      {
        id: userId,
        payload: {
          name: form.name.trim(),
          email: form.email.trim(),
          department: form.department || undefined,
          points: form.points,
          isActive: form.active,
        },
      },
      {
        onSuccess: () => {
          toast.success("Employee profile updated successfully");
          navigate({ to: "/admin/employees/$id", params: { id: userId } });
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update employee profile");
        },
      },
    );
  };

  return (
    <>
      <div>
        <Link
          to="/admin/employees/$id"
          params={{ id: userId }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to details
        </Link>
      </div>
      <PageHeader title={`Edit ${user.name}`} subtitle="Update employee profile and status." />

      <form onSubmit={submit} className="glass max-w-2xl space-y-5 rounded-2xl p-6">
        <Field label="Full name" error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={updateMutation.isPending}
          />
        </Field>
        <Field label="Work email" error={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={updateMutation.isPending}
          />
        </Field>
        <Field label="Department">
          <Select
            value={form.department}
            onValueChange={(v) => setForm({ ...form, department: v })}
            disabled={updateMutation.isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Reward points">
          <Input
            type="number"
            min={0}
            value={form.points}
            onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
            disabled={updateMutation.isPending}
          />
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 p-4">
          <div>
            <p className="text-sm font-medium">Account active</p>
            <p className="text-xs text-muted-foreground">Inactive users cannot sign in.</p>
          </div>
          <Switch
            checked={form.active}
            onCheckedChange={(v) => setForm({ ...form, active: v })}
            disabled={updateMutation.isPending}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-md"
            onClick={() => navigate({ to: "/admin/employees/$id", params: { id: userId } })}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" className="rounded-md shadow-glow" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-4 w-4" /> Save changes
              </>
            )}
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
