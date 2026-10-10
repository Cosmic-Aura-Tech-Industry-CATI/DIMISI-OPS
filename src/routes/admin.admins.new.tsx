import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Loader2, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AccountCreatedDialog } from "@/components/account-created-dialog";
import {
  Field,
  PasswordInput,
  PasswordStrength,
  SectionTitle,
} from "@/components/account-form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isStrongPassword } from "@/lib/password";
import { useDepartmentsQuery, useDesignationsByDepartmentQuery } from "@/features/departments";
import { authService } from "@/auth/services/auth.service";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/client/query-keys";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/admins/new")({
  head: () => ({
    meta: [
      { title: "Add admin — Dimisi" },
      { name: "description", content: "Create a new administrator account and portal credentials." },
      { property: "og:title", content: "Add admin — Dimisi" },
      {
        property: "og:description",
        content: "Create a new administrator account and portal credentials.",
      },
    ],
  }),
  component: NewAdminPage,
});

const DRAFT_KEY = "dimisi:create-admin:draft";
const today = () => new Date().toISOString().slice(0, 10);

const blank = {
  name: "",
  email: "",
  password: "",
  confirm: "",
  departmentId: "",
  designationId: "",
  joinedAt: today(),
  phone: "",
};

function NewAdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: departments = [] } = useDepartmentsQuery();

  const [form, setForm] = useState(blank);
  const [hasDraft, setHasDraft] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ name: string; code: string; email: string } | null>(null);
  const isHydratedRef = useRef(false);

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const safeDraft = {
            name: typeof parsed.name === "string" ? parsed.name : "",
            email: typeof parsed.email === "string" ? parsed.email : "",
            password: "",
            confirm: "",
            departmentId: typeof parsed.departmentId === "string" ? parsed.departmentId : "",
            designationId: typeof parsed.designationId === "string" ? parsed.designationId : "",
            joinedAt: typeof parsed.joinedAt === "string" && parsed.joinedAt ? parsed.joinedAt : today(),
            phone: typeof parsed.phone === "string" ? parsed.phone : "",
          };
          const hasContent = Boolean(
            safeDraft.name ||
            safeDraft.email ||
            safeDraft.departmentId ||
            safeDraft.designationId ||
            safeDraft.phone
          );
          if (hasContent) {
            setForm(safeDraft);
            setHasDraft(true);
            toast.info("Draft restored", {
              description: "Restored unsaved admin information.",
            });
          }
        }
      }
    } catch {
      // Ignore corrupted draft
    } finally {
      isHydratedRef.current = true;
    }
  }, []);

  // Debounced auto-save draft on changes (excluding passwords)
  useEffect(() => {
    if (!isHydratedRef.current || submitting) return;

    const timer = setTimeout(() => {
      const { name, email, departmentId, designationId, joinedAt, phone } = form;
      const hasContent = Boolean(name || email || departmentId || designationId || phone);
      if (hasContent) {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ name, email, departmentId, designationId, joinedAt, phone })
        );
        setHasDraft(true);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [form, submitting]);

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setForm({ ...blank, joinedAt: today() });
    setHasDraft(false);
    setErrors({});
    toast.info("Draft discarded");
  };

  const { data: designations = [] } = useDesignationsByDepartmentQuery(form.departmentId);

  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((prev) => {
      if (!prev[k] && !(k === "designationId" && prev.jobTitle) && !(k === "departmentId" && prev.department)) return prev;
      const next = { ...prev };
      delete next[k];
      if (k === "designationId") delete next.jobTitle;
      if (k === "departmentId") delete next.department;
      return next;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (!isStrongPassword(form.password)) e.password = "Password does not meet all requirements";
    if (!form.confirm) e.confirm = "Please confirm the password";
    else if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    if (!form.departmentId) e.department = "Department is required";
    if (!form.designationId) e.jobTitle = "Designation is required";
    if (!form.joinedAt) e.joinedAt = "Joining date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      const res = await authService.createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: "admin",
        department: form.departmentId,
        designation: form.designationId,
        phone: form.phone.trim() || undefined,
        joinDate: form.joinedAt,
      });

      const user = res.user;
      await queryClient.invalidateQueries({ queryKey: queryKeys.admins.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      await queryClient.invalidateQueries({ queryKey: ["users"] });

      // Clear draft upon successful creation
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);

      toast.success("Admin account created successfully");
      setCreated({
        name: user.name || form.name,
        code: user.empId || user.code || user._id || user.id || "",
        email: user.email || form.email,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || "Failed to create admin account";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
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
      <PageHeader title="Add admin" subtitle="Create an account and Admin Portal credentials." />

      <form onSubmit={submit} noValidate className="glass max-w-3xl space-y-7 rounded-md p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 border-b border-border/60 pb-4">
          <div className="grid h-11 w-11 place-items-center rounded-md border border-primary/25 bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="card-title font-semibold">New administrator</p>
            <p className="text-xs text-muted-foreground">
              Credentials will be registered directly in the database with elevated admin privileges.
            </p>
          </div>
        </div>

        <section className="space-y-4">
          <SectionTitle>Basic information</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Shikhar Dixit"
                disabled={submitting}
              />
            </Field>
            <Field label="Email address" required error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="name@dimisi.com"
                disabled={submitting}
              />
            </Field>
            <Field label="Department" required error={errors.department}>
              <Select
                value={form.departmentId}
                onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v, designationId: "" }))}
                disabled={submitting}
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
            <Field
              label="Designation"
              required
              error={errors.jobTitle}
              hint={!form.departmentId ? "Select a department first" : undefined}
            >
              <Select
                value={form.designationId}
                onValueChange={(v) => set("designationId", v)}
                disabled={!form.departmentId || designations.length === 0 || submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={designations.length ? "Select designation" : "No designations available"} />
                </SelectTrigger>
                <SelectContent>
                  {designations.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.title || d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Phone number" hint="Optional (E.164 format, e.g. +919876543210)">
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+919876543210"
                disabled={submitting}
              />
            </Field>
            <Field label="Joining date" required error={errors.joinedAt}>
              <Input
                type="date"
                value={form.joinedAt}
                onChange={(e) => set("joinedAt", e.target.value)}
                disabled={submitting}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle>Portal credentials</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Password" required error={errors.password}>
              <PasswordInput value={form.password} onChange={(v) => set("password", v)} />
            </Field>
            <Field label="Confirm password" required error={errors.confirm}>
              <PasswordInput value={form.confirm} onChange={(v) => set("confirm", v)} />
            </Field>
          </div>
          <PasswordStrength value={form.password} />
        </section>

        <section className="space-y-4">
          <SectionTitle>Account information</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role">
              <Input value="Admin" readOnly disabled />
            </Field>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            {hasDraft && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={discardDraft}
                disabled={submitting}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Discard draft
              </Button>
            )}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-md"
              onClick={() => navigate({ to: "/admin/admins" })}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-md" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-4 w-4" /> Create admin
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      <AccountCreatedDialog
        open={!!created}
        kind="Admin"
        name={created?.name ?? ""}
        code={created?.code ?? ""}
        email={created?.email ?? ""}
        onDone={() => {
          setCreated(null);
          navigate({ to: "/admin/admins" });
        }}
        onCreateAnother={() => {
          setCreated(null);
          setForm({ ...blank, joinedAt: today() });
          setErrors({});
          localStorage.removeItem(DRAFT_KEY);
          setHasDraft(false);
        }}
      />
    </>
  );
}
