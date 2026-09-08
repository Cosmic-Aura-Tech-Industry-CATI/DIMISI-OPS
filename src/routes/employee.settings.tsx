import { createFileRoute } from "@tanstack/react-router";
<<<<<<< Updated upstream
import { Bell, Key, Monitor, Palette, Trash2, UserCircle } from "lucide-react";
=======
import { Bell, Key, Monitor, Palette, UserCircle } from "lucide-react";
>>>>>>> Stashed changes
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  NotificationsSection,
  ProfileSection,
  SettingCard,
  ThemeSection,
  ToggleRow,
} from "./admin.settings";
import { ChangePasswordCard } from "@/components/change-password-card";
import {
<<<<<<< Updated upstream
  useRevokeOtherSessionsMutation,
  useRevokeSessionMutation,
  useSessionsQuery,
=======
>>>>>>> Stashed changes
  useUpdatePreferencesMutation,
  useUserPreferencesQuery,
} from "@/features/settings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
<<<<<<< Updated upstream
=======
import { logAudit } from "@/lib/audit-log";
>>>>>>> Stashed changes

export const Route = createFileRoute("/employee/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Dimisi Operations" },
      { name: "description", content: "Manage your profile, preferences, theme, password, and notifications." },
      { property: "og:title", content: "Settings — Dimisi Operations" },
      { property: "og:description", content: "Manage your profile, preferences, theme, password, and notifications." },
    ],
  }),
  component: EmployeeSettingsPage,
});

function saveToast(label: string) {
  return () => {
    logAudit({
      category: "settings",
      action: "Updated Personal Settings",
      target: label,
      details: `${label} settings saved.`,
    });
    toast.success(`${label} saved`, {
      description: "Your changes are stored locally (demo).",
    });
  };
}

function EmployeeSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Profile, theme, and account security controls." />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile"><UserCircle className="mr-1.5 h-3.5 w-3.5" />Profile</TabsTrigger>
          <TabsTrigger value="password"><Key className="mr-1.5 h-3.5 w-3.5" />Password</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-1.5 h-3.5 w-3.5" />Notifications</TabsTrigger>
          <TabsTrigger value="theme"><Palette className="mr-1.5 h-3.5 w-3.5" />Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="profile"><ProfileSection role="employee" /></TabsContent>
        <TabsContent value="password"><PasswordSection /></TabsContent>
        <TabsContent value="notifications"><NotificationsSection /></TabsContent>
        <TabsContent value="theme"><ThemeSection /></TabsContent>
      </Tabs>
    </>
  );
}

function PasswordSection() {
  const { data: preferences } = useUserPreferencesQuery();
  const updatePreferences = useUpdatePreferencesMutation();

<<<<<<< Updated upstream
  const { data: sessionsData } = useSessionsQuery();
  const revokeSession = useRevokeSessionMutation();
  const revokeOtherSessions = useRevokeOtherSessionsMutation();

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

  const isEmailVerificationEnabled =
    preferences?.security?.twoFactor?.emailVerification ??
    preferences?.security?.emailOtpEnabled ??
    true;

=======
>>>>>>> Stashed changes
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChangePasswordCard
        wrapper={(p) => (
          <SettingCard title={p.title} description={p.description} actions={p.actions}>
            {p.children}
          </SettingCard>
        )}
      />

      <SettingCard title="Sign-in security" description="Extra protection on your account.">
        <div className="space-y-3">
          <ToggleRow
            title="Email verification on sign-in"
            description="Send an email OTP code to verify new sign-ins."
<<<<<<< Updated upstream
            checked={isEmailVerificationEnabled}
            onChange={(checked) => {
              updatePreferences.mutate(
                { security: { twoFactor: { emailVerification: checked } } },
=======
            checked={preferences?.security?.emailOtpEnabled ?? true}
            onChange={(checked) => {
              updatePreferences.mutate(
                { security: { emailOtpEnabled: checked } },
>>>>>>> Stashed changes
                {
                  onSuccess: () => toast.success("Sign-in security preference updated."),
                  onError: (err: any) => toast.error(err?.message || "Failed to update preference."),
                },
              );
            }}
          />
<<<<<<< Updated upstream
=======
          <ToggleRow
            title="Two-factor authentication requirement"
            description="Require 2FA authentication when accessing the employee portal."
            checked={preferences?.security?.twoFactorEnabled ?? false}
            onChange={(checked) => {
              updatePreferences.mutate(
                { security: { twoFactorEnabled: checked } },
                {
                  onSuccess: () => toast.success("2FA preference updated."),
                  onError: (err: any) => toast.error(err?.message || "Failed to update preference."),
                },
              );
            }}
          />
>>>>>>> Stashed changes
        </div>
      </SettingCard>

      <SettingCard
        title="Sessions"
        description="Devices currently signed in to your account."
        actions={
<<<<<<< Updated upstream
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
              <li key={s.id || s._id} className="flex items-center justify-between gap-3 py-3">
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
=======
          <Button variant="outline" size="sm" className="rounded-md">
            Sign out all
          </Button>
        }
      >
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
                    {s.current && (
                      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.location} · {s.when}
                  </p>
                </div>
              </div>
              {!s.current && (
                <Button variant="ghost" size="sm">
                  Revoke
                </Button>
              )}
            </li>
          ))}
        </ul>
>>>>>>> Stashed changes
      </SettingCard>
    </div>
  );
}
