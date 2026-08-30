import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  ListTodo,
  Mail,
  Pencil,
  Shield,
  Target,
  TrendingUp,
  UserX,
} from "lucide-react";
import { IdBadge } from "@/components/id-badge";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { useEmployeeDetailsQuery } from "@/features/employees";
import { useTasksQuery } from "@/features/tasks";

export const Route = createFileRoute("/admin/employees/$id")({
  head: () => ({
    meta: [
      { title: "Employee Profile — Dimisi Technologies" },
      { name: "description", content: "Detailed employee profile with tasks, activity, performance and points history." },
      { property: "og:title", content: "Employee Profile — Dimisi Technologies" },
      { property: "og:description", content: "Detailed employee profile with tasks, activity, performance and points history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmployeeProfilePage,
});

const fmt = (d?: string | Date) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

const card = "rounded-md border border-border/60 bg-card/40 p-5 transition-colors hover:border-primary/30";

function initials(name: string) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function EmployeeProfilePage() {
  const { id } = useParams({ from: "/admin/employees/$id" });
  const { data: user, isLoading, isError, error } = useEmployeeDetailsQuery(id);
  const { data: allTasks = [] } = useTasksQuery();

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-48 rounded-md" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <EmptyState
        icon={UserX}
        title="Employee not found"
        description={error?.message || "This person may have been removed or does not exist."}
        action={
          <Button asChild>
            <Link to="/admin/employees">Back to list</Link>
          </Button>
        }
      />
    );
  }

  const userId = user._id || "";
  const deptName =
    typeof user.department === "object" && user.department
      ? (user.department as { name?: string }).name || "General"
      : (user.department as string) || "General";

  const titleName =
    typeof user.designation === "object" && user.designation
      ? (user.designation as { name?: string }).name || "Employee"
      : (user.designation as string) || "Employee";

  const empCode = user.empId || "—";
  const userTasks = allTasks.filter((t) => t.assigneeId === userId);

  const completed = userTasks.filter((t) => (t.status || "").toLowerCase() === "completed");
  const active = userTasks.find(
    (t) => (t.status || "").toLowerCase() === "in_progress" || (t.status || "").toLowerCase() === "assigned",
  );
  const successRate = userTasks.length ? Math.round((completed.length / userTasks.length) * 100) : 0;

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

      <PageHeader
        title="Employee Profile"
        subtitle={`${user.name} · ${empCode}`}
        actions={
          <Button asChild variant="outline" className="rounded-md">
            <Link to="/admin/employees/$id/edit" params={{ id: userId }}>
              <Pencil className="mr-1.5 h-4 w-4" /> Edit Employee
            </Link>
          </Button>
        }
      />

      {/* Top section */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`${card} lg:col-span-1`}>
          <div className="flex flex-col items-center text-center">
            <div className="grid h-24 w-24 place-items-center rounded-md border border-primary/25 bg-gradient-to-br from-primary/25 to-primary/5 text-3xl font-semibold text-primary">
              {initials(user.name)}
            </div>
            <p className="mt-4 font-display text-2xl">{user.name}</p>
            <p className="mt-1 text-sm text-primary">{titleName}</p>
            <div className="mt-2">
              <IdBadge id={empCode} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {user.name.split(" ")[0]} is part of the {deptName} department.
            </p>
          </div>
        </div>

        <div className={`${card} lg:col-span-2`}>
          <h2 className="font-display text-xl">Employee Information</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Info icon={Shield} label="Employee ID" value={empCode} mono />
            <Info icon={Building2} label="Department" value={deptName} />
            <Info icon={BadgeCheck} label="Role" value={titleName} />
            <Info icon={Mail} label="Email" value={user.email} />
            <Info icon={CalendarDays} label="Joining Date" value={fmt(user.joinDate || user.createdAt)} />
            <Info
              icon={Target}
              label="Current Status"
              value={
                <span
                  className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${
                    user.isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              }
            />
          </dl>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <Stat icon={ListTodo} label="Assigned Tasks" value={userTasks.length} />
        <Stat icon={CheckCircle2} label="Completed Tasks" value={completed.length} />
        <Stat icon={Award} label="Current Points" value={(user.points ?? 0).toLocaleString()} />
        <Stat icon={TrendingUp} label="Success Rate" value={`${successRate}%`} />
        <Stat icon={Target} label="Status" value={user.isActive ? "Active" : "Inactive"} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 rounded-md">
          <TabsTrigger value="overview" className="rounded-md">
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-md">
            Tasks ({userTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={card}>
              <h3 className="font-display text-lg">Summary</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <Info label="Assigned tasks" value={userTasks.length} />
                <Info label="Completed" value={completed.length} />
                <Info label="Lifetime points" value={(user.points ?? 0).toLocaleString()} />
              </dl>
            </div>
            <div className={card}>
              <h3 className="font-display text-lg">Completion rate</h3>
              <p className="mt-4 font-display text-4xl text-primary">{successRate}%</p>
              <Progress value={successRate} className="mt-3 h-1.5" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="overflow-hidden rounded-md border border-border/60">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Task Title</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 text-right font-medium">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {userTasks.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-xs text-muted-foreground">
                        No tasks assigned to this employee yet.
                      </td>
                    </tr>
                  )}
                  {userTasks.map((t) => (
                    <tr key={t.id} className="border-t border-border/40 transition-colors hover:bg-secondary/20">
                      <td className="px-4 py-3 font-medium">{t.title}</td>
                      <td className="px-4 py-3">{t.status}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.taskType}</td>
                      <td className="px-4 py-3 text-right font-semibold">{t.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-2 text-xs text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      </dt>
      <dd className={`min-w-0 truncate text-right text-sm ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/30">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <p className="line-clamp-2 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 font-sans text-2xl font-semibold">{value}</p>
    </div>
  );
}
