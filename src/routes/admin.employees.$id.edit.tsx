import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Save, UserX } from "lucide-react";
import { toast } from "sonner";
import { useEmployeeDetailsQuery, useUpdateEmployeeDetails } from "@/features/employees";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { IdBadge } from "@/components/id-badge";
import {
  Field,
  SectionTitle,
  DepartmentDesignationSelects,
} from "@/components/account-form-parts";

export const Route = createFileRoute("/admin/employees/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Employee — Dimisi" }] }),
  component: EditEmployeePage,
});

function EditEmployeePage() {
  const { id } = useParams({ from: "/admin/employees/$id/edit" });
  const navigate = useNavigate();

  const { data: user, isLoading, isError, error } = useEmployeeDetailsQuery(id);
  const updateMutation = useUpdateEmployeeDetails();

  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    designation: "",
    phone: "",
    points: 0,
    active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      const deptId =
        typeof user.department === "object" && user.department
          ? (user.department as { _id?: string; id?: string })._id ||
            (user.department as { id?: string }).id ||
            ""
          : (user.department as string) || "";

      const desigId =
        typeof user.designation === "object" && user.designation
          ? (user.designation as { _id?: string; id?: string })._id ||
            (user.designation as { id?: string }).id ||
            ""
          : (user.designation as string) || "";

      setForm({
        name: user.name || "",
        email: user.email || "",
        department: deptId,
        designation: desigId,
        phone: user.phone || "",
        points: user.points ?? 0,
        active: user.isActive !== undefined ? Boolean(user.isActive) : true,
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4 p-6">
        <Skeleton className="h-10 w-48 rounded-md" />
        <Skeleton className="h-96 w-full rounded-2xl" />
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

  const userId = user._id || user.id || id;
  const empCode = user.empId || user.code || user._id || user.id || "—";

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) {
      errs.name = "Full name is required";
    } else if (form.name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters long";
    }

    if (!form.email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    if (!form.department) {
      errs.department = "Department is required";
    }

    if (!form.designation) {
      errs.designation = "Role / Designation is required";
    }

    if (form.phone.trim() && !/^\+[1-9]\d{1,14}$/.test(form.phone.trim())) {
      errs.phone = "Phone must be in E.164 format (e.g. +919876543210)";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    updateMutation.mutate(
      {
        id: userId,
        payload: {
          name: form.name.trim(),
          email: form.email.trim(),
          department: form.department || undefined,
          designation: form.designation || undefined,
          isActive: form.active,
          points: form.points,
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
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
      <PageHeader
        title={`Edit ${user.name}`}
        subtitle="Update employee profile, department, role, and account status."
      />

      <form onSubmit={submit} noValidate className="glass max-w-3xl space-y-6 rounded-md p-5 sm:p-6">
        <section className="space-y-4">
          <SectionTitle>Basic information</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Employee ID" hint="Unique employee identifier (read-only)">
              <div className="flex h-10 w-full items-center justify-between rounded-md border border-border/60 bg-secondary/30 px-3 py-2 font-mono text-xs text-muted-foreground">
                <span>{empCode}</span>
                <IdBadge id={empCode} />
              </div>
            </Field>

            <Field label="Full name" required error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                placeholder="e.g. Jane Doe"
                disabled={updateMutation.isPending}
              />
            </Field>

            <Field label="Work email" required error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                placeholder="jane@dimisi.com"
                disabled={updateMutation.isPending}
              />
            </Field>

            <Field label="Phone number" hint="Optional (E.164 format, e.g. +919876543210)" error={errors.phone}>
              <Input
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: "" });
                }}
                placeholder="+919876543210"
                disabled={updateMutation.isPending}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle>Organization & Role</SectionTitle>
          <DepartmentDesignationSelects
            departmentId={form.department}
            designationId={form.designation}
            onDepartmentChange={(deptId) => {
              setForm((prev) => ({ ...prev, department: deptId, designation: "" }));
              if (errors.department) setErrors((prev) => ({ ...prev, department: "" }));
            }}
            onDesignationChange={(desigId) => {
              setForm((prev) => ({ ...prev, designation: desigId }));
              if (errors.designation) setErrors((prev) => ({ ...prev, designation: "" }));
            }}
            departmentError={errors.department}
            designationError={errors.designation}
            disabled={updateMutation.isPending}
          />

          <Field label="Reward points" hint="Current accumulated points">
            <Input
              type="number"
              min={0}
              value={form.points}
              onChange={(e) => setForm({ ...form, points: Math.max(0, Number(e.target.value)) })}
              disabled={updateMutation.isPending}
            />
          </Field>
        </section>

        <section className="space-y-4">
          <SectionTitle>Account status</SectionTitle>
          <div className="flex items-center justify-between rounded-md border border-border/60 bg-card/40 p-4">
            <div>
              <p className="text-sm font-medium">Account active</p>
              <p className="text-xs text-muted-foreground">
                {form.active
                  ? "Active — Employee can log in and access assigned tasks."
                  : "Inactive — Employee access is suspended and cannot sign in."}
              </p>
            </div>
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
              disabled={updateMutation.isPending}
            />
          </div>
        </section>

        <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-md"
            onClick={() => navigate({ to: "/admin/employees/$id", params: { id: userId } })}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="rounded-md shadow-glow"
            disabled={updateMutation.isPending}
          >
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
