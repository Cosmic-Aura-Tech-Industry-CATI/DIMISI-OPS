import { createFileRoute } from "@tanstack/react-router";
import { Palette, Key } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SettingCard, ToggleRow, ThemeSection } from "./admin.settings";
import { ChangePasswordCard } from "@/components/change-password-card";


export const Route = createFileRoute("/employee/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Poll" },
      { name: "description", content: "Manage your profile, preferences, theme, password, and notifications." },
      { property: "og:title", content: "Settings — Poll" },
      { property: "og:description", content: "Manage your profile, preferences, theme, password, and notifications." },
    ],
  }),
  component: EmployeeSettingsPage,
});

function EmployeeSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Theme and account security controls." />

      <Tabs defaultValue="theme" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="theme"><Palette className="mr-1.5 h-3.5 w-3.5" />Theme</TabsTrigger>
          <TabsTrigger value="password"><Key className="mr-1.5 h-3.5 w-3.5" />Password</TabsTrigger>
        </TabsList>

        <TabsContent value="theme"><ThemeSection /></TabsContent>
        <TabsContent value="password"><PasswordSection /></TabsContent>
      </Tabs>
    </>
  );
}



function PasswordSection() {
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
          <ToggleRow title="Two-factor authentication" description="Require a one-time code when signing in." defaultChecked />
          <ToggleRow title="Sign-in alerts" description="Email me when a new device signs in." defaultChecked />
          <ToggleRow title="Trusted devices" description="Skip 2FA on devices I mark as trusted." />
        </div>
        <Separator className="my-5" />
        <div className="rounded-xl border border-border/60 bg-card/40 p-4">
          <div className="text-sm font-medium">Backup codes</div>
          <p className="mt-1 text-xs text-muted-foreground">Generate one-time codes to sign in when you can't access your authenticator.</p>
          <Button variant="outline" size="sm" className="mt-3 rounded-md">Generate codes</Button>
        </div>
      </SettingCard>
    </div>
  );
}
