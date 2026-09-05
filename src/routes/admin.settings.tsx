import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Bell,
  Check,
  Key,
  Mail,
  MessageSquare,
  Monitor,
  Moon,
  Palette,
  QrCode,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  Upload,
  UserCircle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { logAudit } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth";
import { ChangePasswordCard } from "@/components/change-password-card";
import { useAuth } from "@/lib/auth";
import {
  useRevokeOtherSessionsMutation,
  useRevokeSessionMutation,
  useSessionsQuery,
  useSetup2FaMutation,
  useUpdatePreferencesMutation,
  useUpdateProfileMutation,
  useUpdateWorkspaceSettingsMutation,
  useUserPreferencesQuery,
  useVerify2FaMutation,
  useWorkspaceSettingsQuery,
} from "@/features/settings";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Dimisi Operations" },
      { name: "description", content: "Configure security, appearance, and notification preferences." },
      { property: "og:title", content: "Settings — Dimisi Operations" },
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
  checked,
  defaultChecked,
  onChange,
  disabled,
  icon: Icon,
}: {
  title: string;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
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
      <Switch
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

/* ---------------- Security ---------------- */

function SecuritySection() {
  const { data: preferences } = useUserPreferencesQuery();
  const updatePreferences = useUpdatePreferencesMutation();

  const { data: workspace } = useWorkspaceSettingsQuery();
  const updateWorkspace = useUpdateWorkspaceSettingsMutation();

  const { data: sessionsData } = useSessionsQuery();
  const revokeSession = useRevokeSessionMutation();
  const revokeOtherSessions = useRevokeOtherSessionsMutation();

  const setup2Fa = useSetup2FaMutation();
  const verify2Fa = useVerify2FaMutation();

  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleStartTotpSetup = async () => {
    try {
      const res = await setup2Fa.mutateAsync();
      setQrCodeUrl(res.qrCodeUrl);
      setTotpSecret(res.secret);
      setRecoveryCodes([]);
      setTotpToken("");
      setSetupModalOpen(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to initialize 2FA setup.");
    }
  };

  const handleVerifyTotp = async () => {
    if (!totpToken || totpToken.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }
    setIsVerifying(true);
    try {
      const res = await verify2Fa.mutateAsync(totpToken);
      if (res.recoveryCodes && res.recoveryCodes.length > 0) {
        setRecoveryCodes(res.recoveryCodes);
      }
      toast.success("Two-factor authentication enabled successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Invalid authentication code.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession.mutateAsync(sessionId);
      toast.success("Session revoked successfully.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to revoke session.");
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    try {
      await revokeOtherSessions.mutateAsync();
      toast.success("All other sessions revoked successfully.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to revoke sessions.");
    }
  };

  const allSessions = [
    ...(sessionsData?.currentSession ? [{ ...sessionsData.currentSession, current: true }] : []),
    ...(sessionsData?.otherSessions || []).map((s) => ({ ...s, current: false })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className="rounded-md" onClick={saveToast("Security")}><Save className="mr-1.5 h-4 w-4" />Save</Button>
      </div>
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
        actions={
          <Button
            variant="outline"
            size="sm"
            className="rounded-md"
            onClick={handleStartTotpSetup}
            disabled={setup2Fa.isPending}
          >
            <QrCode className="mr-1.5 h-3.5 w-3.5" /> Setup App
          </Button>
        }
      >
        <div className="space-y-3">
          <ToggleRow
            title="Authenticator app (TOTP)"
            description={
              preferences?.twoFactorAuth?.isTotpEnabled
                ? "Active · Authenticator app enabled."
                : "Not configured · Scan QR to link."
            }
            icon={Smartphone}
            checked={Boolean(preferences?.twoFactorAuth?.isTotpEnabled)}
            disabled
          />
          <ToggleRow
            title="Email verification"
            description="Confirm sign-ins and sensitive changes via one-time email OTP."
            icon={Mail}
            checked={preferences?.security?.emailOtpEnabled ?? true}
            onChange={(checked) => {
              updatePreferences.mutate(
                { security: { emailOtpEnabled: checked } },
                {
                  onSuccess: () => toast.success("Email verification preference updated."),
                  onError: (err: any) => toast.error(err?.message || "Failed to update preference."),
                },
              );
            }}
          />
          <ToggleRow
            title="Two-factor sign-in requirement"
            description="Require secondary verification when logging in to your account."
            icon={ShieldCheck}
            checked={preferences?.security?.twoFactorEnabled ?? false}
            onChange={(checked) => {
              updatePreferences.mutate(
                { security: { twoFactorEnabled: checked } },
                {
                  onSuccess: () => toast.success("Two-factor sign-in requirement updated."),
                  onError: (err: any) => toast.error(err?.message || "Failed to update preference."),
                },
              );
            }}
          />
        </div>
      </SettingCard>

      <SettingCard
        title="Active sessions"
        description="Devices currently signed in to your account."
        actions={
          allSessions.length > 1 ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-md text-destructive hover:bg-destructive/10"
              onClick={handleRevokeAllOtherSessions}
              disabled={revokeOtherSessions.isPending}
            >
              Sign out all others
            </Button>
          ) : undefined
        }
      >
        {allSessions.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No active session records found
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {allSessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {s.device || s.browser || "Active Device"}
                      {s.os && <span className="text-xs text-muted-foreground">({s.os})</span>}
                      {s.current && (
                        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.location || s.ipAddress || "Localhost"} ·{" "}
                      {s.lastActive
                        ? new Date(s.lastActive).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "Active now"}
                    </p>
                  </div>
                </div>
                {!s.current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => handleRevokeSession(s.id)}
                    disabled={revokeSession.isPending}
                  >
                    <Trash2 className="mr-1 h-3 w-3" /> Revoke
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </SettingCard>

      {isDirector && (
        <SettingCard
          title="Access & privacy"
          description="Workspace-level access controls."
        >
          <div className="space-y-3">
            <ToggleRow title="Allow SSO sign-in" description="Enable Google / Microsoft sign-in for employees." defaultChecked />
            <ToggleRow title="Require 2FA for all admins" description="Force every admin to enable two-factor sign-in." defaultChecked />
          </div>
        </SettingCard>
      )}
      </div>
      <SettingCard title="Workspace access & privacy" description="Organization-wide policies.">
        <div className="space-y-3">
          <ToggleRow
            title="Require 2FA for all admins"
            description="Force every admin and director to configure two-factor verification."
            icon={ShieldAlert}
            checked={workspace?.require2FaForAdmins ?? true}
            onChange={(checked) => {
              updateWorkspace.mutate(
                { require2FaForAdmins: checked },
                {
                  onSuccess: () => toast.success("Workspace 2FA requirement updated."),
                  onError: (err: any) => toast.error(err?.message || "Director privilege required."),
                },
              );
            }}
          />
          <ToggleRow
            title="Allow SSO sign-in"
            description="Permit sign-in via enterprise identity providers (Google / Microsoft)."
            icon={Key}
            checked={workspace?.allowSsoSignIn ?? true}
            onChange={(checked) => {
              updateWorkspace.mutate(
                { allowSsoSignIn: checked },
                {
                  onSuccess: () => toast.success("Workspace SSO policy updated."),
                  onError: (err: any) => toast.error(err?.message || "Director privilege required."),
                },
              );
            }}
          />
        </div>
      </SettingCard>

      {/* 2FA Setup Modal */}
      <Dialog open={setupModalOpen} onOpenChange={setSetupModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set up Authenticator App</DialogTitle>
            <DialogDescription>
              Scan the QR code with Google Authenticator, Authy, or 1Password.
            </DialogDescription>
          </DialogHeader>

          {recoveryCodes.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
                <p className="font-semibold">Two-Factor Authentication is Active!</p>
                <p className="mt-1 text-xs text-foreground/80">
                  Save these backup recovery codes in a secure location:
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs bg-muted p-3 rounded-lg">
                {recoveryCodes.map((c, i) => (
                  <div key={i} className="p-1">{c}</div>
                ))}
              </div>
              <Button className="w-full" onClick={() => setSetupModalOpen(false)}>
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {qrCodeUrl && (
                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl">
                  <img src={qrCodeUrl} alt="2FA QR Code" className="h-44 w-44" />
                </div>
              )}
              {totpSecret && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Secret key (manual entry):</p>
                  <p className="font-mono text-xs font-semibold select-all mt-0.5">{totpSecret}</p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Verification Code</Label>
                <Input
                  maxLength={6}
                  placeholder="6-digit code"
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value.trim())}
                  className="font-mono text-center tracking-widest text-lg"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleVerifyTotp}
                disabled={isVerifying || totpToken.length !== 6}
              >
                {isVerifying ? "Verifying…" : "Enable Authenticator"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Theme ---------------- */

export function ThemeSection() {
  const { theme, setTheme } = useTheme();
  const updatePreferences = useUpdatePreferencesMutation();

  const options: Array<{ value: "light" | "dark"; label: string; icon: typeof Sun }> = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  const handleSelectTheme = (val: "light" | "dark") => {
    setTheme(val);
    updatePreferences.mutate({ theme: val });
  };

  return (
    <div className="grid gap-6">
      <SettingCard title="Appearance" description="Choose how Dimisi Operations looks on this device.">
        <div className="grid grid-cols-2 gap-4 sm:max-w-md">
          {options.map((o) => {
            const active = theme === o.value;
            const Icon = o.icon;
            return (
              <button
                key={o.value}
                onClick={() => handleSelectTheme(o.value)}
                className={cn(
                  "group relative overflow-hidden rounded-xl border p-4 text-left transition",
                  active
                    ? "border-primary bg-primary/10 shadow-glow"
                    : "border-border/60 bg-card/40 hover:border-primary/40",
                )}
              >
                <div
                  className={cn(
                    "mb-3 grid h-10 w-10 place-items-center rounded-lg",
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
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
  const { data: preferences } = useUserPreferencesQuery();
  const updatePreferences = useUpdatePreferencesMutation();

  const handleNotificationToggle = (
    key: "email" | "push" | "marketing",
    value: boolean,
  ) => {
    updatePreferences.mutate(
      { notifications: { [key]: value } },
      {
        onSuccess: () => toast.success("Notification preferences updated."),
        onError: (err: any) => toast.error(err?.message || "Failed to update notification settings."),
      },
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SettingCard title="Email notifications" description="Control what gets delivered to your inbox.">
        <div className="space-y-3">
          <ToggleRow
            title="Task assignments & reviews"
            description="Notify me when tasks are assigned, requested, or reviewed."
            icon={Mail}
            checked={preferences?.notifications?.email ?? true}
            onChange={(checked) => handleNotificationToggle("email", checked)}
          />
          <ToggleRow
            title="Product & announcement updates"
            description="Company notices and major workspace announcements."
            icon={MessageSquare}
            checked={preferences?.notifications?.marketing ?? true}
            onChange={(checked) => handleNotificationToggle("marketing", checked)}
          />
        </div>
      </SettingCard>

      <SettingCard title="Push notifications" description="In-app alerts and desktop push.">
        <div className="space-y-3">
          <ToggleRow
            title="Real-time push alerts"
            description="Show alerts for task deadlines, mentions, and point awards."
            icon={Bell}
            checked={preferences?.notifications?.push ?? true}
            onChange={(checked) => handleNotificationToggle("push", checked)}
          />
        </div>
      </SettingCard>
    </div>
  );
}

/* ---------------- Profile ---------------- */

export function ProfileSection({ role }: { role: "admin" | "employee" }) {
  const { user } = useAuth();
  const updateProfile = useUpdateProfileMutation();
  const [phone, setPhone] = useState(user?.phone || "+1 (555) 214-8890");

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({ phone });
      logAudit({
        category: "settings",
        action: "Updated Profile",
        target: "Personal Information",
        details: "User updated contact details.",
      });
      toast.success("Profile saved successfully.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile.");
    }
  };

  const name = user?.name || (role === "admin" ? "Admin User" : "Employee User");
  const avatar = user?.avatar || name.slice(0, 2).toUpperCase();
  const email = user?.email || "user@dimisi.com";
  const dept = typeof user?.department === "object" && user?.department !== null ? (user.department as any).name : (user?.department || "Operations");
  const code = user?.code || "EMP-01";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <SettingCard title="Avatar" description="Profile photo and visual identifier.">
        <div className="flex flex-col items-center gap-4">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary to-accent font-display text-3xl font-bold shadow-glow">
            {avatar}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-md">
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">JPG or PNG · square · up to 5MB</p>
        </div>
      </SettingCard>

      <div className="lg:col-span-2">
        <SettingCard
          title="Personal information"
          description="Your identity across the Dimisi Operations workspace."
          actions={
            <Button
              className="rounded-md"
              onClick={handleSaveProfile}
              disabled={updateProfile.isPending}
            >
              <Save className="mr-1.5 h-4 w-4" /> Save
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" defaultValue={name} disabled />
            <Field label="Employee ID / Code" defaultValue={code} disabled />
            <Field label="Email" type="email" defaultValue={email} disabled />
            <Field
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Field label="Department" defaultValue={dept} disabled />
            <Field label="Role" defaultValue={role.toUpperCase()} disabled />
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
