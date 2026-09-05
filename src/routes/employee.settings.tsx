import { createFileRoute } from "@tanstack/react-router";
import { Bell, Key, Palette, UserCircle } from "lucide-react";
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
  useUpdatePreferencesMutation,
  useUserPreferencesQuery,
} from "@/features/settings";
import { toast } from "sonner";

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
            checked={preferences?.security?.emailOtpEnabled ?? true}
            onChange={(checked) => {
              updatePreferences.mutate(
                { security: { emailOtpEnabled: checked } },
                {
                  onSuccess: () => toast.success("Sign-in security preference updated."),
                  onError: (err: any) => toast.error(err?.message || "Failed to update preference."),
                },
              );
            }}
          />
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
        </div>
      </SettingCard>
    </div>
  );
}
