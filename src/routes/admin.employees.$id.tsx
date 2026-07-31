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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { admins, employees, tasks, activityLogs, adminAccountFor } from "@/lib/mock-data";

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


const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const card = "rounded-md border border-border/60 bg-card/40 p-5 transition-colors hover:border-primary/30";

function EmployeeProfilePage() {
  const { id } = useParams({ from: "/admin/employees/$id" });
  // Employee section always resolves the EMPLOYEE account (and its employee ID) first.
  const person = employees.find((e) => e.id === id) ?? admins.find((a) => a.id === id);

  if (!person) {
    return (
      <EmptyState
        icon={UserX}
        title="Employee not found"
        description="This person may have been removed."
        action={<Button asChild><Link to="/admin/employees">Back to list</Link></Button>}
      />
    );
  }

  const userTasks = tasks.filter((t) => t.assigneeId === person.id);
  const completed = userTasks.filter((t) => t.status === "completed");
  const pending = userTasks.filter((t) => t.status === "pending" || t.status === "overdue");
  const active = userTasks.find((t) => t.status === "in_progress");
  const todays = userTasks.filter((t) => t.status !== "completed").slice(0, 3);
  const successRate = userTasks.length ? Math.round((completed.length / userTasks.length) * 100) : 0;
  const history = activityLogs.filter((a) => a.user === person.name);

  const timeline = [
    { label: "Task assigned", detail: active?.title ?? userTasks[0]?.title ?? "Onboarding checklist", at: "2026-07-25T09:12:00Z", icon: ListTodo },
    { label: "Task started", detail: active?.title ?? userTasks[0]?.title ?? "Onboarding checklist", at: "2026-07-25T11:40:00Z", icon: Clock },
    { label: "Proof submitted", detail: completed[0]?.title ?? "Weekly report", at: "2026-07-27T16:05:00Z", icon: BadgeCheck },
    { label: "Task approved", detail: completed[0]?.title ?? "Weekly report", at: "2026-07-28T08:20:00Z", icon: CheckCircle2 },
    { label: "Points awarded", detail: `+${completed[0]?.points ?? 60} reward points`, at: "2026-07-28T08:21:00Z", icon: Award },
  ];

  let running = 0;
  const points = [
    { date: "2026-07-12", reason: "Task approved · Legacy cron cleanup", earned: 25 },
    { date: "2026-07-18", reason: "Weekly streak bonus", earned: 40 },
    { date: "2026-07-24", reason: "Task approved · Fix mobile crash on iOS 19", earned: 75 },
    { date: "2026-07-27", reason: "Task approved · API rate-limit dashboard", earned: 60 },
    { date: "2026-07-29", reason: "Peer recognition", earned: 30 },
  ].map((p) => ({ ...p, total: (running += p.earned) }));

  return (
    <>
      <div>
        <Link to="/admin/employees" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to employees
        </Link>
      </div>

      <PageHeader
        title="Employee Profile"
        subtitle={`${person.name} · ${person.code}`}
        actions={
          <Button asChild variant="outline" className="rounded-md">
            <Link to="/admin/employees/$id/edit" params={{ id: person.id }}>
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
              {person.avatar}
            </div>
            <p className="mt-4 font-display text-2xl">{person.name}</p>
            <p className="mt-1 text-sm text-primary">{person.jobTitle}</p>
            <div className="mt-2"><IdBadge id={person.code} /></div>
            {adminAccountFor(person.name) && (
              <Link
                to="/admin/admins/$id"
                params={{ id: adminAccountFor(person.name)!.id }}
                className="mt-2 text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                Also an admin — view admin account ({adminAccountFor(person.name)!.code})
              </Link>
            )}
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {person.name.split(" ")[0]} is part of the {person.department} team, focused on delivering high-quality
              work across assigned initiatives. Consistently maintains a strong completion rate and collaborates
              closely with stakeholders.
            </p>
          </div>
        </div>

        <div className={`${card} lg:col-span-2`}>
          <h2 className="font-display text-xl">Employee Information</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Info icon={Shield} label="Employee ID" value={person.code} mono />
            <Info icon={Building2} label="Department" value={person.department} />
            <Info icon={BadgeCheck} label="Role" value={person.jobTitle} />
            <Info icon={Mail} label="Email" value={person.email} />
            <Info icon={CalendarDays} label="Joining Date" value={fmt(person.joinedAt)} />
            <Info
              icon={Target}
              label="Current Status"
              value={
                <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${person.status === "active" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" /> {person.status}
                </span>
              }
            />
          </dl>

          <div className="mt-6 rounded-md border border-border/60 bg-background/40 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current assigned task</p>
            {active ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{active.title}</p>
                <StatusBadge status={active.status} />
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No active task assigned.</p>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Stat icon={ListTodo} label="Today's Tasks" value={todays.length} />
        <Stat icon={Clock} label="Pending Tasks" value={pending.length} />
        <Stat icon={CheckCircle2} label="Completed Tasks" value={completed.length} />
        <Stat icon={Award} label="Current Points" value={person.points.toLocaleString()} />
        <Stat icon={TrendingUp} label="Success Rate" value={`${successRate}%`} />
        <Stat icon={Target} label="Total Completed" value={person.tasksCompleted} />
      </div>

      {/* Current task details */}
      <div className={card}>
        <h2 className="font-display text-xl">Current Task Details</h2>
        {active ? (
          <div className="mt-4 space-y-5">
            <div>
              <p className="font-display text-2xl">{active.title}</p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{active.description}</p>
            </div>
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Priority" value={<PriorityBadge priority={active.priority} />} />
              <Info label="Assigned Date" value={fmt(active.createdAt)} />
              <Info label="Deadline" value={fmt(active.dueDate)} />
              <Info label="Reward Points" value={`${active.points} pts`} />
              <Info label="Current Status" value={<StatusBadge status={active.status} />} />
              <Info label="Category" value={active.category} />
            </dl>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No active task assigned.</p>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 rounded-md">
          <TabsTrigger value="overview" className="rounded-md">Overview</TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-md">Tasks</TabsTrigger>
          <TabsTrigger value="activity" className="rounded-md">Activity</TabsTrigger>
          <TabsTrigger value="performance" className="rounded-md">Performance</TabsTrigger>
          <TabsTrigger value="points" className="rounded-md">Points History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={card}>
              <h3 className="font-display text-lg">Summary</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <Info label="Assigned tasks" value={userTasks.length} />
                <Info label="Completed" value={completed.length} />
                <Info label="Pending / overdue" value={pending.length} />
                <Info label="Lifetime points" value={person.points.toLocaleString()} />
              </dl>
            </div>
            <div className={card}>
              <h3 className="font-display text-lg">Completion rate</h3>
              <p className="mt-4 font-display text-4xl text-primary">{successRate}%</p>
              <Progress value={successRate} className="mt-3 h-1.5" />
              <p className="mt-3 text-xs text-muted-foreground">
                Based on {userTasks.length} assigned tasks in the current cycle.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="overflow-hidden rounded-md border border-border/60">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Task Name</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Assigned</th>
                    <th className="px-4 py-3 font-medium">Deadline</th>
                    <th className="px-4 py-3 text-right font-medium">Points</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userTasks.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-muted-foreground">No tasks assigned.</td></tr>
                  )}
                  {userTasks.map((t) => (
                    <tr key={t.id} className="border-t border-border/40 transition-colors hover:bg-secondary/20">
                      <td className="px-4 py-3 font-medium">{t.title}</td>
                      <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{fmt(t.createdAt)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmt(t.dueDate)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{t.points}</td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild size="sm" variant="ghost" className="rounded-md">
                          <Link to="/admin/tasks/$id" params={{ id: t.id }}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className={card}>
            <ol className="relative space-y-6 border-l border-border/60 pl-6">
              {timeline.map((item) => (
                <li key={item.label} className="relative">
                  <span className="absolute -left-[31px] grid h-5 w-5 place-items-center rounded-full border border-primary/40 bg-background text-primary">
                    <item.icon className="h-3 w-3" />
                  </span>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{new Date(item.at).toLocaleString()}</p>
                </li>
              ))}
              {history.slice(0, 3).map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[31px] mt-1.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="text-sm"><span className="text-muted-foreground">{a.action}</span> <span className="font-medium">{a.target}</span></p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</p>
                </li>
              ))}
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Meter label="Completion Rate" value={successRate} caption="Tasks completed vs assigned" />
            <Meter label="Weekly Performance" value={82} caption="Last 7 days output score" />
            <Meter label="Monthly Performance" value={76} caption="Rolling 30-day output score" />
            <Meter label="Task Success Rate" value={Math.max(successRate, 68)} caption="Approved on first submission" />
          </div>
          <div className={card}>
            <h3 className="font-display text-lg">Department Comparison</h3>
            <div className="mt-4 space-y-4">
              {[
                { name: person.department, value: 88 },
                { name: "Company average", value: 71 },
                { name: "Top performer", value: 96 },
              ].map((d) => (
                <div key={d.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-medium">{d.value}%</span>
                  </div>
                  <Progress value={d.value} className="mt-2 h-1.5" />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="points">
          <div className="overflow-hidden rounded-md border border-border/60">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="px-4 py-3 text-right font-medium">Points Earned</th>
                    <th className="px-4 py-3 text-right font-medium">Running Total</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p) => (
                    <tr key={p.date} className="border-t border-border/40 transition-colors hover:bg-secondary/20">
                      <td className="px-4 py-3 text-muted-foreground">{fmt(p.date)}</td>
                      <td className="px-4 py-3">{p.reason}</td>
                      <td className="px-4 py-3 text-right font-semibold text-primary">+{p.earned}</td>
                      <td className="px-4 py-3 text-right font-medium">{p.total}</td>
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

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
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

function Meter({ label, value, caption }: { label: string; value: number; caption: string }) {
  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg">{label}</h3>
        <span className="font-sans text-xl font-semibold text-primary">{value}%</span>
      </div>
      <Progress value={value} className="mt-3 h-1.5" />
      <p className="mt-2 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}
