import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  ListTodo,
  Mail,
  Monitor,
  Moon,
  Palette,
  QrCode,
  RotateCcw,
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { logAudit } from "@/lib/audit-log";
import { updateProfile as updateProfileStore } from "@/lib/profile-store";
import { AvatarUpload } from "@/components/avatar-upload";
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
      {
        name: "description",
        content: "Configure security, appearance, and notification preferences.",
      },
      { property: "og:title", content: "Settings — Dimisi Operations" },
      {
        property: "og:description",
        content: "Configure security, appearance, and notification preferences.",
      },
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
          <TabsTrigger value="security">
            <Shield className="mr-1.5 h-3.5 w-3.5" />
            Security
          </TabsTrigger>
          <TabsTrigger value="theme">
            <Palette className="mr-1.5 h-3.5 w-3.5" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-1.5 h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="profile">
            <UserCircle className="mr-1.5 h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security">
          <SecuritySection />
        </TabsContent>
        <TabsContent value="theme">
          <ThemeSection />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsSection role="admin" />
        </TabsContent>
        <TabsContent value="profile">
          <ProfileSection role="admin" />
        </TabsContent>
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
  const { user } = useAuth();
  const isDirector = String(user?.role || "").toLowerCase() === "director";

  const {
    data: preferences,
    isLoading: isLoadingPrefs,
    isError: isErrorPrefs,
    refetch: refetchPrefs,
  } = useUserPreferencesQuery();
  const updatePreferences = useUpdatePreferencesMutation();

  const {
    data: workspace,
    isLoading: isLoadingWorkspace,
    isError: isErrorWorkspace,
    refetch: refetchWorkspace,
  } = useWorkspaceSettingsQuery();
  const updateWorkspace = useUpdateWorkspaceSettingsMutation();

  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    isError: isErrorSessions,
    refetch: refetchSessions,
  } = useSessionsQuery();
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
      setQrCodeUrl(res.qrCodeUrl || res.qrCode);
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
      } else {
        setSetupModalOpen(false);
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

  const isTotpConfigured = Boolean(
    preferences?.twoFactorAuth?.isTotpEnabled ||
    preferences?.security?.twoFactor?.authenticatorApp ||
    preferences?.security?.twoFactor?.isAuthenticatorVerified,
  );

  const isEmailOtpEnabled =
    preferences?.security?.twoFactor?.emailVerification ??
    preferences?.security?.emailOtpEnabled ??
    true;

  return (
    <div className="space-y-6">
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
              disabled={setup2Fa.isPending || isLoadingPrefs}
            >
              <QrCode className="mr-1.5 h-3.5 w-3.5" /> Setup App
            </Button>
          }
        >
          {isLoadingPrefs ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : isErrorPrefs ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Failed to load 2FA settings.
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => refetchPrefs()}
              >
                <RotateCcw className="mr-1 h-3 w-3" /> Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <ToggleRow
                title="Authenticator app"
                description={
                  isTotpConfigured
                    ? "Active · Authenticator app enabled."
                    : "Not configured · Scan QR to link."
                }
                icon={Smartphone}
                checked={isTotpConfigured}
                disabled
              />
              <ToggleRow
                title="Email verification"
                description="Confirm sign-ins and sensitive changes via one-time email OTP."
                icon={Mail}
                checked={isEmailOtpEnabled}
                onChange={(checked) => {
                  updatePreferences.mutate(
                    { security: { twoFactor: { emailVerification: checked } } },
                    {
                      onSuccess: () => toast.success("Email verification preference updated."),
                      onError: (err: any) =>
                        toast.error(err?.message || "Failed to update preference."),
                    },
                  );
                }}
              />
            </div>
          )}
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
          {isLoadingSessions ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : isErrorSessions ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Failed to load active sessions.
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => refetchSessions()}
              >
                <RotateCcw className="mr-1 h-3 w-3" /> Retry
              </Button>
            </div>
          ) : allSessions.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No active session records found
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {allSessions.map((s) => (
                <li key={s.id || s._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {s.device || s.browser || "Active Device"}
                        {s.os && <span className="text-xs text-muted-foreground">({s.os})</span>}
                        {s.current && (
                          <Badge
                            variant="outline"
                            className="border-primary/30 bg-primary/10 text-primary"
                          >
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {s.location || s.ipAddress || "Active"} ·{" "}
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
                      onClick={() => handleRevokeSession(s.id || s._id || "")}
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
          <SettingCard title="Access & privacy" description="Workspace-level access controls.">
            {isLoadingWorkspace ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : isErrorWorkspace ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Failed to load workspace settings.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => refetchWorkspace()}
                >
                  <RotateCcw className="mr-1 h-3 w-3" /> Retry
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <ToggleRow
                  title="Allow SSO sign-in"
                  description="Enable Google / Microsoft sign-in for employees."
                  checked={workspace?.allowSsoSignIn ?? true}
                  onChange={(checked) => {
                    updateWorkspace.mutate(
                      { allowSsoSignIn: checked },
                      {
                        onSuccess: () => toast.success("Workspace setting updated."),
                        onError: (err: any) =>
                          toast.error(err?.message || "Failed to update workspace setting."),
                      },
                    );
                  }}
                />
                <ToggleRow
                  title="Require 2FA for all admins"
                  description="Force every admin to enable two-factor sign-in."
                  checked={workspace?.require2FaForAdmins ?? false}
                  onChange={(checked) => {
                    updateWorkspace.mutate(
                      { require2FaForAdmins: checked },
                      {
                        onSuccess: () => toast.success("Workspace setting updated."),
                        onError: (err: any) =>
                          toast.error(err?.message || "Failed to update workspace setting."),
                      },
                    );
                  }}
                />
              </div>
            )}
          </SettingCard>
        )}
      </div>
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
                  <div key={i} className="p-1">
                    {c}
                  </div>
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
  const { data: preferences, isLoading, isError, refetch } = useUserPreferencesQuery();
  const updatePreferences = useUpdatePreferencesMutation();

  const options: Array<{ value: "light" | "dark"; label: string; icon: typeof Sun }> = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  const handleSelectTheme = (val: "light" | "dark") => {
    setTheme(val);
    updatePreferences.mutate(
      { theme: val },
      {
        onError: (err: any) => toast.error(err?.message || "Failed to update theme preference."),
      },
    );
  };

  return (
    <div className="grid gap-6">
      <SettingCard
        title="Appearance"
        description="Choose how Dimisi Operations looks on this device."
      >
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:max-w-md">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Failed to load appearance preferences.
            </span>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => refetch()}>
              <RotateCcw className="mr-1 h-3 w-3" /> Retry
            </Button>
          </div>
        ) : (
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
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
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
        )}
      </SettingCard>
    </div>
  );
}

/* ---------------- Notifications ---------------- */

/** Debounce delay for quiet-hours inputs (ms). Toggle switches fire immediately. */
const QUIET_HOURS_DEBOUNCE_MS = 800;

/**
 * Build the minimal partial payload for a single changed notification field.
 * Only the field that changed is sent in the request body.
 */
function buildNotifPatch(
  section: "inApp" | "email",
  key: string,
  value: boolean,
): { notifications: { inApp?: Record<string, boolean>; email?: Record<string, boolean> } } {
  return { notifications: { [section]: { [key]: value } } };
}

export function NotificationsSection({ role }: { role?: "admin" | "employee" }) {
  const { user } = useAuth();
  const effectiveRole =
    role || (user?.role === "admin" || user?.role === "director" ? "admin" : "employee");
  const isAdm = effectiveRole === "admin";

  const { data: preferences, isLoading, isError, refetch } = useUserPreferencesQuery();
  const updatePreferences = useUpdatePreferencesMutation();

  // Local state mirrors server state for optimistic UI
  const [localInApp, setLocalInApp] = useState<Record<string, boolean>>({});
  const [localEmail, setLocalEmail] = useState<Record<string, boolean>>({});
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");

  // Debounce ref for quiet-hours
  const quietTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (preferences?.notifications) {
      const inApp = ((preferences.notifications.inApp || {}) as Record<string, boolean>) || {};
      const email = ((preferences.notifications.email || {}) as Record<string, boolean>) || {};
      setLocalInApp(inApp);
      setLocalEmail(email);
      setQuietStart(preferences.notifications.deliverySchedule?.quietHoursStart || "22:00");
      setQuietEnd(preferences.notifications.deliverySchedule?.quietHoursEnd || "07:00");
    }
  }, [preferences]);

  /** Toggle handler — fires API immediately with only the changed field */
  const handleInAppToggle = useCallback(
    (key: string, value: boolean) => {
      setLocalInApp((prev) => ({ ...prev, [key]: value }));
      updatePreferences.mutate(buildNotifPatch("inApp", key, value), {
        onSuccess: () => toast.success("Notification preference updated."),
        onError: (err: any) => {
          // Revert optimistic update on failure
          setLocalInApp((prev) => ({ ...prev, [key]: !value }));
          toast.error(err?.message || "Failed to update preference.");
        },
      });
    },
    [updatePreferences],
  );

  const handleEmailToggle = useCallback(
    (key: string, value: boolean) => {
      setLocalEmail((prev) => ({ ...prev, [key]: value }));
      updatePreferences.mutate(buildNotifPatch("email", key, value), {
        onSuccess: () => toast.success("Notification preference updated."),
        onError: (err: any) => {
          setLocalEmail((prev) => ({ ...prev, [key]: !value }));
          toast.error(err?.message || "Failed to update preference.");
        },
      });
    },
    [updatePreferences],
  );

  /** Quiet hours — debounced save triggered on input change */
  const saveQuietHours = useCallback(
    (start: string, end: string) => {
      if (quietTimerRef.current) clearTimeout(quietTimerRef.current);
      quietTimerRef.current = setTimeout(() => {
        updatePreferences.mutate(
          {
            notifications: {
              deliverySchedule: { quietHoursStart: start, quietHoursEnd: end },
            },
          },
          {
            onSuccess: () => toast.success("Quiet hours updated."),
            onError: (err: any) => toast.error(err?.message || "Failed to update quiet hours."),
          },
        );
      }, QUIET_HOURS_DEBOUNCE_MS);
    },
    [updatePreferences],
  );

  const handleQuietStartChange = (val: string) => {
    setQuietStart(val);
    saveQuietHours(val, quietEnd);
  };

  const handleQuietEndChange = (val: string) => {
    setQuietEnd(val);
    saveQuietHours(quietStart, val);
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <SettingCard title="In-App Notifications" description="What shows in your notification tray.">
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </SettingCard>
        <SettingCard title="Email Notifications" description="What we email you about.">
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </SettingCard>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
        <span className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Failed to load notification settings. Please check your internet connection or try again.
        </span>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RotateCcw className="mr-1.5 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* In-App Notifications */}
        <SettingCard
          title="In-App Notifications"
          description="Control real-time alerts displayed in your notification tray."
        >
          <div className="space-y-3">
            {isAdm ? (
              <>
                <ToggleRow
                  title="New submissions"
                  description="When an employee submits a completed task for your review and approval."
                  icon={CheckCircle2}
                  checked={localInApp.reviewRequests ?? true}
                  disabled={updatePreferences.isPending}
                  onChange={(c) => handleInAppToggle("reviewRequests", c)}
                />
                <ToggleRow
                  title="Universal task applications"
                  description="When an employee applies or requests to acquire an open universal task."
                  icon={Layers}
                  checked={localInApp.universalTask ?? true}
                  disabled={updatePreferences.isPending}
                  onChange={(c) => handleInAppToggle("universalTask", c)}
                />
                <ToggleRow
                  title="Overdue tasks"
                  description="When tasks exceed their deadline or require immediate escalation."
                  icon={Clock}
                  checked={localInApp.taskOverdue ?? true}
                  disabled={updatePreferences.isPending}
                  onChange={(c) => handleInAppToggle("taskOverdue", c)}
                />
              </>
            ) : (
              <>
                <ToggleRow
                  title="Task assignments"
                  description="When a new task is assigned directly to you."
                  icon={ListTodo}
                  checked={localInApp.taskAssignments ?? true}
                  disabled={updatePreferences.isPending}
                  onChange={(c) => handleInAppToggle("taskAssignments", c)}
                />
                <ToggleRow
                  title="Review actions"
                  description="When your task submission is approved or rejected by an admin."
                  icon={CheckCircle2}
                  checked={localInApp.reviewActions ?? true}
                  disabled={updatePreferences.isPending}
                  onChange={(c) => handleInAppToggle("reviewActions", c)}
                />
                <ToggleRow
                  title="Overdue tasks"
                  description="Reminders when your active assigned tasks are approaching deadline or overdue."
                  icon={Clock}
                  checked={localInApp.taskOverdue ?? true}
                  disabled={updatePreferences.isPending}
                  onChange={(c) => handleInAppToggle("taskOverdue", c)}
                />
              </>
            )}
          </div>
        </SettingCard>

        {/* Email Notifications */}
        <SettingCard
          title="Email Notifications"
          description="Configure email alerts for high-priority operational workflows."
        >
          <div className="space-y-3">
            {isAdm ? (
              <>
                <ToggleRow
                  title="New submissions"
                  description="Receive email notifications when new submissions await your review."
                  icon={Mail}
                  checked={localEmail.reviewRequests ?? true}
                  disabled={updatePreferences.isPending}
                  onChange={(c) => handleEmailToggle("reviewRequests", c)}
                />
                <ToggleRow
                  title="Universal task applications"
                  description="Receive email notifications when an employee applies for an open task."
                  icon={Mail}
                  checked={localEmail.universalTask ?? true}
                  disabled={updatePreferences.isPending}
                  onChange={(c) => handleEmailToggle("universalTask", c)}
                />
              </>
            ) : (
              <>
                <ToggleRow
                  title="Task assignments"
                  description="Receive email notifications when a task is assigned to you."
                  icon={Mail}
                  checked={localEmail.taskAssignments ?? true}
                  disabled={updatePreferences.isPending}
                  onChange={(c) => handleEmailToggle("taskAssignments", c)}
                />
              </>
            )}
          </div>
        </SettingCard>

        {/* Delivery Schedule */}
        <div className="lg:col-span-2">
          <SettingCard
            title="Delivery schedule"
            description="Quiet hours — non-urgent notifications will be batched during this window."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Quiet hours start</Label>
                <Input
                  type="time"
                  value={quietStart}
                  onChange={(e) => handleQuietStartChange(e.target.value)}
                  disabled={updatePreferences.isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Quiet hours end</Label>
                <Input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => handleQuietEndChange(e.target.value)}
                  disabled={updatePreferences.isPending}
                />
              </div>
            </div>
          </SettingCard>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Profile ---------------- */

export function ProfileSection({ role }: { role: "admin" | "employee" }) {
  const { user, setUser } = useAuth();
  const updateProfile = useUpdateProfileMutation();
  const [phone, setPhone] = useState(user?.phone || "");
  const [photo, setPhoto] = useState<string>(user?.avatar || (user as any)?.avtar || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setPhone(user.phone || "");
      setPhoto(user.avatar || (user as any)?.avtar || "");
    }
  }, [user]);

  const onPickFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG, PNG, GIF, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5 MB.");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    try {
      const payload: Record<string, any> = { phone: phone.trim() };

      const res = await updateProfile.mutateAsync(payload);
      const updatedUser = (res?.user || res?.data?.user || res?.data || res) as
        Record<string, unknown> | undefined;

      const newPhone =
        (typeof updatedUser?.phone === "string" ? updatedUser.phone : undefined) ?? phone.trim();

      if (user) {
        setUser({
          ...user,
          phone: newPhone,
        });
      }

      updateProfileStore({ phone: newPhone });

      logAudit({
        category: "settings",
        action: "Updated Profile",
        target: "Personal Information",
        details: "User updated contact details.",
      });
      toast.success("Profile saved successfully.");
      setSelectedFile(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile.");
    }
  };

  const name = user?.name || (role === "admin" ? "Admin User" : "Employee User");
  const email = user?.email || "user@dimisi.com";
  const dept =
    typeof user?.department === "object" && user?.department !== null
      ? (user.department as any).name
      : user?.department || "Operations";
  const code = (user as any)?.empId || user?.code || user?.id || (user as any)?._id || "—";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <SettingCard title="Avatar" description="Profile photo and visual identifier.">
        <AvatarUpload
          value={photo}
          name={name}
          autoUpload={true}
          disabled={updateProfile.isPending}
          onUploadSuccess={async ({ avatar, avatarPublicId }) => {
            try {
              const res = await updateProfile.mutateAsync({ avatar, avatarPublicId });
              const updatedUser = (res?.user || res?.data?.user || res?.data || res) as
                Record<string, unknown> | undefined;
              const newAvatar =
                (typeof updatedUser?.avatar === "string" ? updatedUser.avatar : undefined) ||
                avatar;

              setPhoto(newAvatar);
              if (user) {
                setUser({
                  ...user,
                  avatar: newAvatar,
                });
              }
              updateProfileStore({ photo: newAvatar });
              logAudit({
                category: "settings",
                action: "Updated Profile",
                target: "Avatar",
                details: "User uploaded a new profile picture.",
              });
              toast.success("Profile photo updated successfully.");
            } catch (err: any) {
              toast.error(err?.message || "Failed to save profile with new photo.");
              throw err;
            }
          }}
          onRemove={async () => {
            try {
              await updateProfile.mutateAsync({ avatar: "", avatarPublicId: "" });
              setPhoto("");
              if (user) {
                setUser({
                  ...user,
                  avatar: "",
                });
              }
              updateProfileStore({ photo: null });
              logAudit({
                category: "settings",
                action: "Updated Profile",
                target: "Avatar",
                details: "User removed profile picture.",
              });
              toast.success("Profile photo removed.");
            } catch (err: any) {
              toast.error(err?.message || "Failed to remove profile photo.");
              throw err;
            }
          }}
        />
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
              <Save className="mr-1.5 h-4 w-4" /> Save changes
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={name} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Employee ID</Label>
              <Input value={code} disabled className="bg-muted/50 font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>Email address</Label>
              <Input value={email} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input value={dept} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input
                value={role === "admin" ? "Operations Admin" : "Employee"}
                disabled
                className="bg-muted/50"
              />
            </div>
          </div>
        </SettingCard>
      </div>
    </div>
  );
}
