import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Shield,
  Palette,
  Bell,
  UserCircle,
  Upload,
  Key,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Save,
  Check,
  Mail,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { logAudit } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth";
import { ChangePasswordCard } from "@/components/change-password-card";


export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Poll Admin" },
      { name: "description", content: "Configure security, appearance, and notification preferences." },
      { property: "og:title", content: "Settings — Poll Admin" },
      { property: "og:description", content: "Configure security, appearance, and notification preferences." },
    ],
  }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Workspace, security, and personal preferences." />

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="security"><Shield className="mr-1.5 h-3.5 w-3.5" />Security</TabsTrigger>
          <TabsTrigger value="theme"><Palette className="mr-1.5 h-3.5 w-3.5" />Theme</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-1.5 h-3.5 w-3.5" />Notifications</TabsTrigger>
          <TabsTrigger value="profile"><UserCircle className="mr-1.5 h-3.5 w-3.5" />Profile</TabsTrigger>
        </TabsList>


        <TabsContent value="security"><SecuritySection /></TabsContent>
        <TabsContent value="theme"><ThemeSection /></TabsContent>
        <TabsContent value="notifications"><NotificationsSection /></TabsContent>
        <TabsContent value="profile"><ProfileSection role="admin" /></TabsContent>
      </Tabs>
    </>
  );
}

/* ---------------- Shared building blocks ---------------- */

export function SettingCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass rounded-2xl p-6", className)}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function ToggleRow({
  title,
  description,
  defaultChecked,
  icon: Icon,
}: {
  title: string;
  description?: string;
  defaultChecked?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <div className="text-sm font-medium">{title}</div>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

function saveToast(label: string) {
  return () => (
    logAudit({ category: "settings", action: "Updated System Settings", target: label, details: `${label} settings saved.` }),
    toast.success(`${label} saved`, { description: "Your changes are stored locally (demo)." }));
}


/* ---------------- Security ---------------- */

function SecuritySection() {
  const { user } = useAuth();
  const isDirector = String(user?.role || "").toLowerCase() === "director";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChangePasswordCard
        wrapper={(p) => (
          <SettingCard title={p.title} description={p.description} actions={p.actions}>
            {p.children}
          </SettingCard>
        )}
      />

      <SettingCard
        title="Two-factor authentication"
        description="Add an extra layer of protection to your account."
        actions={<Button className="rounded-md" onClick={saveToast("Security")}><Save className="mr-1.5 h-4 w-4" />Save</Button>}
      >
        <div className="space-y-3">
          <ToggleRow title="Authenticator app" description="Use apps like 1Password or Authy." icon={Smartphone} defaultChecked />
          <ToggleRow title="Email verification" description="Confirm sign-ins from new devices via email." icon={Mail} defaultChecked />
        </div>
      </SettingCard>

      <SettingCard title="Sessions" description="Devices currently signed in to your account." actions={<Button variant="outline" size="sm" className="rounded-md">Sign out all</Button>}>
        <ul className="divide-y divide-border/60">
          {[
            { device: "MacBook Pro · Chrome", location: "San Francisco, US", when: "Active now", current: true },
            { device: "iPhone 15 · Safari", location: "San Francisco, US", when: "2h ago" },
            { device: "Windows · Edge", location: "Austin, US", when: "3d ago" },
          ].map((s) => (
            <li key={s.device} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {s.device}
                    {s.current && <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">Current</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{s.location} · {s.when}</p>
                </div>
              </div>
              {!s.current && <Button variant="ghost" size="sm">Revoke</Button>}
            </li>
          ))}
        </ul>
      </SettingCard>

      {isDirector && (
        <SettingCard
          title="Access & privacy"
          description="Workspace-level access controls."
          actions={<Button className="rounded-md" onClick={saveToast("Access & privacy")}><Save className="mr-1.5 h-4 w-4" />Save</Button>}
        >
          <div className="space-y-3">
            <ToggleRow title="Allow SSO sign-in" description="Enable Google / Microsoft sign-in for employees." defaultChecked />
          </div>
        </SettingCard>
      )}
    </div>
  );
}

/* ---------------- Theme ---------------- */

export function ThemeSection() {
  const { theme, setTheme } = useTheme();
  const options: Array<{ value: "light" | "dark"; label: string; icon: typeof Sun }> = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];
  return (
    <div className="grid gap-6">
      <SettingCard title="Appearance" description="Choose how Poll looks on this device.">
        <div className="grid grid-cols-3 gap-3">
          {options.map((o) => {
            const active = theme === o.value;
            const Icon = o.icon;
            return (
              <button
                key={o.value}
                onClick={() => setTheme(o.value)}
                className={cn(
                  "group relative overflow-hidden rounded-xl border p-4 text-left transition",
                  active ? "border-primary bg-primary/10 shadow-glow" : "border-border/60 bg-card/40 hover:border-primary/40",
                )}
              >
                <div className={cn(
                  "mb-3 grid h-10 w-10 place-items-center rounded-lg",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium">{o.label}</div>
                {active && (
                  <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </SettingCard>
    </div>
  );
}

/* ---------------- Notifications ---------------- */

export function NotificationsSection() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <SettingCard
          title="Email notifications"
          description="What we email you about."
          actions={<Button className="rounded-md" onClick={saveToast("Notifications")}><Save className="mr-1.5 h-4 w-4" />Save</Button>}
        >
          <div className="space-y-3">
            <ToggleRow title="Task assignments" description="When a task is assigned to you or your team." icon={Mail} defaultChecked />
            <ToggleRow title="Review requests" description="New submissions waiting for approval." icon={Mail} defaultChecked />
            <ToggleRow title="Weekly digest" description="Summary of activity and performance every Monday." icon={Mail} />
            <ToggleRow title="Product updates" description="New features and improvements." icon={Mail} />
          </div>
        </SettingCard>

        <SettingCard
          title="In-app notifications"
          description="What shows in your notification tray."
          actions={<Button className="rounded-md" onClick={saveToast("Notifications")}><Save className="mr-1.5 h-4 w-4" />Save</Button>}
        >
          <div className="space-y-3">
            <ToggleRow title="Deadline reminders" description="24 hours before a task is due." icon={Bell} defaultChecked />
            <ToggleRow title="Task approvals" description="Approvals and rejections on submissions." icon={Bell} defaultChecked />
            <ToggleRow title="Points earned" description="When points are credited to an employee." icon={Bell} defaultChecked />
            <ToggleRow title="Mentions & comments" description="When someone mentions you in a task." icon={Bell} defaultChecked />
          </div>
        </SettingCard>
      </div>

      <SettingCard
        title="Delivery schedule"
        description="Quiet hours and preferred delivery windows."
        actions={<Button className="rounded-md" onClick={saveToast("Notifications")}><Save className="mr-1.5 h-4 w-4" />Save</Button>}
      >
        <div className="space-y-4">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2.5 rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-primary" />
                <Label htmlFor="quiet-start" className="cursor-pointer font-medium">Quiet hours start</Label>
              </div>
              <Input id="quiet-start" type="time" defaultValue="22:00" className="h-10 bg-background/50" />
              <p className="text-xs text-muted-foreground">Notifications paused from this time</p>
            </div>

            <div className="space-y-2.5 rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-primary" />
                <Label htmlFor="quiet-end" className="cursor-pointer font-medium">Quiet hours end</Label>
              </div>
              <Input id="quiet-end" type="time" defaultValue="07:00" className="h-10 bg-background/50" />
              <p className="text-xs text-muted-foreground">Normal delivery resumes after this time</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/40 p-3.5 text-xs text-muted-foreground">
            <Bell className="h-4 w-4 shrink-0 text-primary" />
            <span>Non-urgent notifications will be batched during this window. High-priority alerts will still arrive immediately.</span>
          </div>
        </div>
      </SettingCard>
    </div>
  );
}

/* ---------------- Profile ---------------- */

export function ProfileSection({ role }: { role: "admin" | "employee" }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <SettingCard title="Avatar" description="A friendly face for your profile.">
        <div className="flex flex-col items-center gap-4">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary to-accent font-display text-3xl font-bold shadow-glow">
            {role === "admin" ? "AD" : "EM"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-md"><Upload className="mr-1.5 h-3.5 w-3.5" />Upload</Button>
            <Button variant="ghost" size="sm">Remove</Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">PNG or JPG · square · up to 5MB</p>
        </div>
      </SettingCard>

      <div className="lg:col-span-2">
        <SettingCard
          title="Personal information"
          description="This information appears on your public profile."
          actions={<Button className="rounded-md" onClick={saveToast("Profile")}><Save className="mr-1.5 h-4 w-4" />Save</Button>}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" defaultValue={role === "admin" ? "Ava Chen" : "Sam Rivera"} />
            <Field label="Job title" defaultValue={role === "admin" ? "Workspace Admin" : "Product Designer"} />
            <Field label="Email" type="email" defaultValue={role === "admin" ? "ava@poll.app" : "sam@poll.app"} />
            <Field label="Phone" defaultValue="+1 (555) 214-8890" />
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select defaultValue="design">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="eng">Engineering</SelectItem>
                  <SelectItem value="ops">Operations</SelectItem>
                  <SelectItem value="mkt">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Bio</Label>
              <Textarea rows={3} placeholder="Say a few words about yourself…" defaultValue="Building calm, well-crafted internal tools that people actually enjoy using." />
            </div>
          </div>
        </SettingCard>
      </div>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input {...props} />
    </div>
  );
}
