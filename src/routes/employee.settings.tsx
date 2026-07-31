import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Palette, Key, Save, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SettingCard, ToggleRow, ThemeSection } from "./admin.settings";

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
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState("");
  const checks = [
    { label: "At least 12 characters", ok: pw.length >= 12 },
    { label: "Contains a number", ok: /\d/.test(pw) },
    { label: "Contains an uppercase letter", ok: /[A-Z]/.test(pw) },
    { label: "Contains a symbol", ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  const strength = checks.filter((c) => c.ok).length;
  const strengthLabel = ["Too weak", "Weak", "Okay", "Good", "Strong"][strength];
  const strengthTone = ["bg-zinc-700", "bg-zinc-600", "bg-primary", "bg-zinc-300", "bg-white"][strength];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SettingCard
        title="Change password"
        description="Choose a password you don't use anywhere else."
        actions={
          <Button className="rounded-md" onClick={() => toast.success("Password updated", { description: "Please sign in again on other devices (demo)." })}>
            <Save className="mr-1.5 h-4 w-4" />Update
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Current password</Label>
            <div className="relative">
              <Input type={show ? "text" : "password"} placeholder="••••••••" />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>New password</Label>
            <Input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 12 characters" />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm new password</Label>
            <Input type={show ? "text" : "password"} placeholder="Re-enter new password" />
          </div>

          {/* Strength meter */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Strength</span>
              <span className="font-medium">{strengthLabel}</span>
            </div>
            <div className="mt-1.5 flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i < strength ? strengthTone : "bg-muted"}`} />
              ))}
            </div>
          </div>

          <Separator />
          <ul className="grid grid-cols-2 gap-2 text-xs">
            {checks.map((c) => (
              <li key={c.label} className={`flex items-center gap-2 ${c.ok ? "text-primary" : "text-muted-foreground"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${c.ok ? "bg-zinc-400" : "bg-muted-foreground/40"}`} />
                {c.label}
              </li>
            ))}
          </ul>
        </div>
      </SettingCard>

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
