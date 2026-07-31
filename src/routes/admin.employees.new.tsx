import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { IdBadge } from "@/components/id-badge";
import { PageHeader } from "@/components/page-header";
import { AccountCreatedDialog } from "@/components/account-created-dialog";
import {
  DEPARTMENTS,
  DESIGNATIONS,
  Field,
  PasswordInput,
  PasswordStrength,
  SectionTitle,
} from "@/components/account-form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEmployeeAccount, emailTaken, nextEmployeeCode, useAccounts } from "@/lib/accounts";
import { isStrongPassword } from "@/lib/password";

export const Route = createFileRoute("/admin/employees/new")({
  head: () => ({
    meta: [
      { title: "Add employee — Dimisi" },
      { name: "description", content: "Create a new employee account and portal credentials." },
      { property: "og:title", content: "Add employee — Dimisi" },
      {
        property: "og:description",
        content: "Create a new employee account and portal credentials.",
      },
    ],
  }),
  component: NewEmployeePage,
});

const today = () => new Date().toISOString().slice(0, 10);

const blank = {
  name: "",
  email: "",
  password: "",
  confirm: "",
  department: "Engineering",
  jobTitle: DESIGNATIONS[0],
  joinedAt: today(),
  phone: "",
  about: "",
  status: "active" as "active" | "inactive",
};

function NewEmployeePage() {
  const navigate = useNavigate();
  const accounts = useAccounts();
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<{ name: string; code: string; email: string } | null>(null);

  const previewId = useMemo(
    () => nextEmployeeCode(form.joinedAt),
    // recompute when store or joining date changes
    [form.joinedAt, accounts],
  );

  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email";
    else if (emailTaken(form.email)) e.email = "This email is already registered";
    if (!form.password) e.password = "Password is required";
    else if (!isStrongPassword(form.password)) e.password = "Password does not meet all requirements";
    if (!form.confirm) e.confirm = "Please confirm the password";
    else if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    if (!form.department) e.department = "Department is required";
    if (!form.jobTitle) e.jobTitle = "Designation is required";
    if (!form.joinedAt) e.joinedAt = "Joining date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const person = createEmployeeAccount({
      name: form.name,
      email: form.email,
      password: form.password,
      department: form.department,
      jobTitle: form.jobTitle,
      joinedAt: form.joinedAt,
      phone: form.phone,
      about: form.about,
      status: form.status,
    });
    setCreated({ name: person.name, code: person.code, email: person.email });
  };

  return (
    <>
      <div>
        <Link
          to="/admin/employees"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to employees
        </Link>
      </div>
      <PageHeader title="Add employee" subtitle="Create an account and Employee Portal credentials." />

      <form onSubmit={submit} noValidate className="glass max-w-3xl space-y-7 rounded-md p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 border-b border-border/60 pb-4">
          <div className="grid h-11 w-11 place-items-center rounded-md border border-primary/25 bg-primary/10 text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="card-title font-semibold">New employee</p>
            <p className="text-xs text-muted-foreground">
              These credentials are used to sign in to the Employee Portal.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            Employee ID <IdBadge id={previewId} />
          </div>
        </div>

        <section className="space-y-4">
          <SectionTitle>Basic information</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ava Chen"
              />
            </Field>
            <Field label="Email address" required error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="ava@dimisi.com"
              />
            </Field>
            <Field label="Department" required error={errors.department}>
              <Select value={form.department} onValueChange={(v) => set("department", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Designation" required error={errors.jobTitle}>
              <Select value={form.jobTitle} onValueChange={(v) => set("jobTitle", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DESIGNATIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Joining date" required error={errors.joinedAt}>
              <Input
                type="date"
                value={form.joinedAt}
                onChange={(e) => set("joinedAt", e.target.value)}
              />
            </Field>
            <Field label="Phone number" hint="Optional">
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </Field>
          </div>
          <Field label="About employee" hint="Optional">
            <Textarea
              rows={3}
              value={form.about}
              onChange={(e) => set("about", e.target.value)}
              placeholder="Short bio, specialisms, or notes."
            />
          </Field>
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
              <Input value="Employee" readOnly disabled />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as "active" | "inactive")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-md"
            onClick={() => navigate({ to: "/admin/employees" })}
          >
            Cancel
          </Button>
          <Button type="submit" className="rounded-md">
            <Save className="mr-1.5 h-4 w-4" /> Create employee
          </Button>
        </div>
      </form>

      <AccountCreatedDialog
        open={!!created}
        kind="Employee"
        name={created?.name ?? ""}
        code={created?.code ?? ""}
        email={created?.email ?? ""}
        onDone={() => {
          setCreated(null);
          navigate({ to: "/admin/employees" });
        }}
        onCreateAnother={() => {
          setCreated(null);
          setForm({ ...blank, joinedAt: today() });
          setErrors({});
        }}
      />
    </>
  );
}
