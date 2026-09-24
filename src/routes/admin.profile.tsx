import { createFileRoute, Link } from "@tanstack/react-router";
import {
  User,
  Mail,
  Building2,
  ShieldCheck,
  Phone,
  Calendar,
  Key,
  Edit,
  Activity,
  Award,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IdBadge } from "@/components/id-badge";
import { useAuth } from "@/lib/auth";
import { StatCard } from "@/components/stat-card";
import { useMemo } from "react";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({
    meta: [
      { title: "Admin Profile — Dimisi Operations" },
      {
        name: "description",
        content: "View and manage your administrator profile and security configuration.",
      },
      { property: "og:title", content: "Admin Profile — Dimisi Operations" },
      {
        property: "og:description",
        content: "View and manage your administrator profile and security configuration.",
      },
    ],
  }),
  component: AdminProfilePage,
});

function AdminProfilePage() {
  const { user } = useAuth();

  const details = useMemo(() => {
    const name = user?.name || "Operations Admin";
    const email = user?.email || "admin@dimisi.com";
    const code = user?.empId || user?.code || user?.id || (user as any)?._id || "—";
    const role = user?.role === "director" ? "Director of Operations" : "Operations Admin";
    const dept =
      typeof user?.department === "object" && user?.department !== null
        ? (user.department as any).name
        : user?.department || "Executive Operations";
    const avatar = user?.avatar || name.slice(0, 2).toUpperCase();
    const isImageAvatar =
      avatar.startsWith("data:") ||
      avatar.startsWith("http") ||
      avatar.startsWith("/") ||
      avatar.includes("/");
    const phone = user?.phone || "+1 (555) 214-8890";
    const joinDate = user?.joinDate || "Jan 15, 2024";

    return {
      name,
      email,
      code,
      role,
      dept,
      avatar,
      isImageAvatar,
      phone,
      joinDate,
    };
  }, [user]);

  return (
    <>
      <PageHeader
        title="Admin Profile"
        subtitle="Manage your administrator identity, permissions, and security configuration."
        actions={
          <Button asChild className="rounded-md shadow-glow">
            <Link to="/admin/settings">
              <Edit className="mr-2 h-4 w-4" /> Edit Profile & Settings
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="glass flex flex-col items-center rounded-2xl p-6 text-center">
          <div className="relative mb-4">
            <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-linear-to-br from-primary to-accent font-display text-4xl font-bold shadow-glow ring-4 ring-background">
              {details.isImageAvatar ? (
                <img src={details.avatar} alt={details.name} className="h-full w-full object-cover" />
              ) : (
                <span>{details.avatar}</span>
              )}
            </div>
            <span className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-success text-success-foreground ring-2 ring-background">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
          </div>

          <h2 className="font-display text-xl font-bold">{details.name}</h2>
          <div className="mt-1 flex items-center gap-2">
            <IdBadge id={details.code} />
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
              {details.role}
            </Badge>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">{details.email}</p>

          <div className="mt-6 w-full space-y-3 border-t border-border/60 pt-4 text-left text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" /> Department
              </span>
              <span className="font-medium">{details.dept}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" /> Phone
              </span>
              <span className="font-medium">{details.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /> Joined
              </span>
              <span className="font-medium">{details.joinDate}</span>
            </div>
          </div>
        </div>

        {/* Info & Quick Actions */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Role privileges" value="Full Access" icon={ShieldCheck} accent="primary" />
            <StatCard label="Security tier" value="2FA Active" icon={Key} accent="success" />
            <StatCard label="System status" value="Active" icon={Activity} accent="info" />
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-base font-semibold">Administrator Access & Controls</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              As an administrator, your account is granted full workspace management privileges including user access, audit logs, task approvals, and system reporting.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button asChild variant="outline" className="justify-start rounded-xl p-4">
                <Link to="/admin/settings">
                  <Edit className="mr-3 h-4 w-4 text-primary" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Update Profile</div>
                    <div className="text-[11px] text-muted-foreground">Change photo & phone number</div>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start rounded-xl p-4">
                <Link to="/admin/settings">
                  <Key className="mr-3 h-4 w-4 text-primary" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Security & Password</div>
                    <div className="text-[11px] text-muted-foreground">Password, 2FA & sessions</div>
                  </div>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
