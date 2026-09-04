import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Shield,
  Palette,
  Bell,
  Smartphone,
  Mail,
  Monitor,
  Save,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { logAudit } from "@/lib/audit-log";
import { ChangePasswordCard } from "@/components/change-password-card";
import {
  SettingCard,
  ToggleRow,
  ThemeSection,
  NotificationsSection,
} from "./admin.settings";

export const Route = createFileRoute("/employee/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Poll" },
      { name: "description", content: "Configure security, appearance, and notification preferences." },
      { property: "og:title", content: "Settings — Poll" },
      { property: "og:description", content: "Configure security, appearance, and notification preferences." },
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
      <PageHeader
        title="Settings"
        subtitle="Workspace, security, and personal preferences."
      />

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
        </TabsList>

        <TabsContent value="security">
          <SecuritySection />
        </TabsContent>
        <TabsContent value="theme">
          <ThemeSection />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsSection />
        </TabsContent>
      </Tabs>
    </>
  );
}

function SecuritySection() {
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
        actions={
          <Button className="rounded-md" onClick={saveToast("Security")}>
            <Save className="mr-1.5 h-4 w-4" />
            Save
          </Button>
        }
      >
        <div className="space-y-3">
          <ToggleRow
            title="Authenticator app"
            description="Use apps like 1Password or Authy."
            icon={Smartphone}
            defaultChecked
          />
          <ToggleRow
            title="Email verification"
            description="Confirm sign-ins from new devices via email."
            icon={Mail}
            defaultChecked
          />
        </div>
      </SettingCard>

      <SettingCard
        title="Sessions"
        description="Devices currently signed in to your account."
        actions={
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
      </SettingCard>
    </div>
  );
}
