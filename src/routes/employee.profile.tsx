import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Mail,
  Building2,
  Calendar,
  Sparkles,
  Trophy,
  Target,
  Flame,
  Zap,
  Star,
  Crown,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  Rocket,
  MapPin,
  Phone,
  Briefcase,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { IdBadge } from "@/components/id-badge";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import {
  currentEmployee,
  tasks,
  performanceTrend,
} from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { useEditableProfile } from "@/lib/profile-store";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employee/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Poll" },
      { name: "description", content: "Your performance, achievements, and history at a glance." },
      { property: "og:title", content: "Profile — Poll" },
      { property: "og:description", content: "Your performance, achievements, and history at a glance." },
    ],
  }),
  component: ProfilePage,
});

const achievements = [
  {
    title: "Top Performer",
    desc: "Ranked #1 for two consecutive weeks",
    Icon: Crown,
    tone: "from-primary/25 to-primary/10 text-primary border-primary/30",
  },
  {
    title: "Streak Master",
    desc: "18-day active streak",
    Icon: Flame,
    tone: "from-primary/25 to-primary/10 text-primary border-primary/30",
  },
  {
    title: "Sharp Shooter",
    desc: "94% on-time delivery",
    Icon: Target,
    tone: "from-primary/25 to-primary/10 text-primary border-primary/30",
  },
  {
    title: "Rising Star",
    desc: "+320 points this month",
    Icon: Rocket,
    tone: "from-primary/25 to-primary/10 text-primary border-primary/30",
  },
];

function ProfilePage() {
  const { user } = useAuth();
  const editable = useEditableProfile();
  const [editOpen, setEditOpen] = useState(false);

  const e = useMemo(() => {
    if (user) {
      return {
        id: user.id || user._id || currentEmployee.id,
        code: user.code || user.empId || currentEmployee.code,
        name: user.name || currentEmployee.name,
        email: user.email || currentEmployee.email,
        role: (user.role as "employee" | "admin") || "employee",
        jobTitle: user.designation || currentEmployee.jobTitle,
        department: (user.department as any)?.name || user.department || currentEmployee.department,
        avatar: user.avatar || currentEmployee.avatar,
        points: (user as any).rewardPoints ?? user.points ?? currentEmployee.points,
        tasksCompleted: currentEmployee.tasksCompleted,
        status: (user.isActive === false ? "inactive" : "active") as "active" | "inactive",
        joinedAt: user.joinDate || currentEmployee.joinedAt,
        phone: user.phone || currentEmployee.phone || "",
      };
    }
    return currentEmployee;
  }, [user]);


  const myTasks = useMemo(() => tasks.filter((t) => t.assigneeId === e.id), [e.id]);
  const completed = myTasks.filter((t) => t.status === "completed").length;
  const active = myTasks.filter((t) => t.status === "in_progress").length;
  const pending = myTasks.filter((t) => t.status === "pending").length;
  const completionRate = myTasks.length
    ? Math.round((completed / myTasks.length) * 100)
    : 0;

  const pointsHistory = useMemo(
    () =>
      performanceTrend.map((p, i) => ({
        ...p,
        cumulative: performanceTrend.slice(0, i + 1).reduce((s, x) => s + x.points, 0),
      })),
    [],
  );

  const recentTasks = myTasks.slice(0, 6);

  const stats = [
    { label: "Total points", value: e.points.toLocaleString(), Icon: Sparkles, tone: "text-primary" },
    { label: "Completed", value: completed, Icon: CheckCircle2, tone: "text-primary" },
    { label: "Active", value: active, Icon: Clock, tone: "text-primary" },
    { label: "Completion", value: `${completionRate}%`, Icon: TrendingUp, tone: "text-primary" },
  ];

  return (
    <>
      <PageHeader title="Profile" subtitle="Your performance, achievements and history in one place." />

      {/* Hero */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="relative h-28 border-b border-border/60 bg-gradient-to-r from-primary/15 via-card to-card sm:h-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_120%,hsl(var(--primary)/0.18),transparent_65%)]" />
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:32px_32px]" />
        </div>
        <div className="-mt-12 flex flex-col gap-5 p-5 sm:-mt-14 sm:flex-row sm:items-end sm:gap-6 sm:p-6">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border/60 bg-muted font-display text-2xl font-bold text-foreground shadow-lg ring-4 ring-background sm:h-24 sm:w-24 sm:text-3xl">
            {editable.photo ? (
              <img src={editable.photo} alt={`${e.name} profile photo`} className="h-full w-full object-cover" />
            ) : (
              e.avatar
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-semibold sm:text-2xl">{e.name}</h2>
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                {e.department}
              </Badge>
              <Badge variant="outline" className={cn("capitalize", e.status === "active" ? "border-primary/30 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground")}>{e.status}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm">
              <IdBadge id={e.code} />
              <span className="inline-flex min-w-0 items-center gap-1.5"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{e.email}</span></span>
              <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 shrink-0" />{e.department}</span>
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 shrink-0" />Joined {new Date(e.joinedAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
              <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 shrink-0" />{e.points.toLocaleString()} pts</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button className="w-full rounded-md sm:w-auto" onClick={() => setEditOpen(true)}>Edit profile</Button>
          </div>
        </div>


        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-px border-t border-border/60 bg-border/40 sm:grid-cols-4">
          {stats.map(({ label, value, Icon, tone }) => (
            <div key={label} className="flex items-center gap-3 bg-card/60 px-5 py-4">
              <div className={cn("grid h-9 w-9 place-items-center rounded-xl bg-muted", tone)}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="font-display text-lg font-semibold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Basic Info + Performance */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6 lg:col-span-1">
          <h3 className="font-display text-lg font-semibold">Basic information</h3>
          <Separator className="my-4" />
          <dl className="space-y-4 text-sm">
            {[
              { Icon: Briefcase, label: "Employee ID", value: e.id.toUpperCase() },
              { Icon: Building2, label: "Department", value: e.department },
              { Icon: Mail, label: "Email", value: e.email },
              { Icon: Phone, label: "Phone", value: editable.phone || e.phone || "+1 (415) 555-0142" },
              { Icon: MapPin, label: "Location", value: "San Francisco, CA" },
              { Icon: Calendar, label: "Joined", value: new Date(e.joinedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 truncate font-medium">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Performance</h3>
              <p className="text-xs text-muted-foreground">Weekly points and completed tasks trend</p>
            </div>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              <TrendingUp className="mr-1 h-3 w-3" /> +12.4%
            </Badge>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTrend}>
                <defs>
                  <linearGradient id="ptsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.19 45)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.72 0.19 45)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.28 0 0)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" stroke="oklch(0.65 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.65 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0 0)",
                    border: "1px solid oklch(0.28 0 0)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="points"
                  stroke="oklch(0.72 0.19 45)"
                  strokeWidth={2}
                  fill="url(#ptsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Achievements (Temporarily commented out)
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Achievements</h3>
          <span className="text-xs text-muted-foreground">{achievements.length} unlocked</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {achievements.map(({ title, desc, Icon, tone }, i) => (
            <div
              key={title}
              className={cn(
                "glass relative overflow-hidden rounded-2xl border p-5 animate-in fade-in slide-in-from-bottom-2",
                tone,
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-current opacity-10 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-background/40 backdrop-blur">
                  <Icon className="h-5 w-5" />
                </div>
                <Award className="ml-auto h-4 w-4 opacity-70" />
              </div>
              <div className="relative mt-4">
                <div className="font-display text-base font-semibold text-foreground">{title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      */}

      {/* Charts row: Points history + Weekly tasks */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Points history</h3>
              <p className="text-xs text-muted-foreground">Cumulative points earned over time</p>
            </div>
            <div className="text-right">
              <div className="font-display text-xl font-semibold text-gradient">
                {pointsHistory[pointsHistory.length - 1]?.cumulative.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">total</div>
            </div>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pointsHistory}>
                <defs>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.19 45)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.72 0.19 45)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.28 0 0)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" stroke="oklch(0.65 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.65 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0 0)",
                    border: "1px solid oklch(0.28 0 0)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="cumulative" stroke="oklch(0.72 0.19 45)" strokeWidth={2} fill="url(#cumGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Weekly tasks</h3>
              <p className="text-xs text-muted-foreground">Tasks completed per week</p>
            </div>
            <Badge variant="outline" className="border-border/60">Last 8 weeks</Badge>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceTrend}>
                <CartesianGrid stroke="oklch(0.28 0 0)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" stroke="oklch(0.65 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.65 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0 0)",
                    border: "1px solid oklch(0.28 0 0)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="tasks" fill="oklch(0.72 0.19 45)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Task History */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h3 className="font-display text-lg font-semibold">Task history</h3>
            <p className="text-xs text-muted-foreground">Your most recent {recentTasks.length} tasks</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="rounded-md">
            <Link to="/employee/tasks">View all</Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead>Task</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTasks.map((t) => (
                <TableRow key={t.id} className="border-border/40">
                  <TableCell>
                    <Link to="/employee/tasks/$id" params={{ id: t.id }} className="font-medium hover:text-primary">
                      {t.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.category}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell className="text-right font-medium">+{t.points}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {new Date(t.dueDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                  </TableCell>
                </TableRow>
              ))}
              {recentTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No tasks assigned yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Points history detail */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h3 className="font-display text-lg font-semibold">Points history</h3>
            <p className="text-xs text-muted-foreground">Weekly breakdown of points and tasks</p>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            <Trophy className="mr-1 h-3 w-3" /> {pending} pending payouts
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead>Week</TableHead>
                <TableHead className="text-right">Points earned</TableHead>
                <TableHead className="text-right">Tasks completed</TableHead>
                <TableHead className="text-right">Avg / task</TableHead>
                <TableHead className="text-right">Cumulative</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pointsHistory
                .slice()
                .reverse()
                .map((p) => (
                  <TableRow key={p.week} className="border-border/40">
                    <TableCell className="font-medium">{p.week}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1 font-medium text-primary">
                        <Sparkles className="h-3 w-3" />+{p.points}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{p.tasks}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {Math.round(p.points / p.tasks)}
                    </TableCell>
                    <TableCell className="text-right font-display font-semibold">
                      {p.cumulative.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <EditProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initials={e.avatar}
        currentPhone={e.phone}
        readOnly={[
          { label: "Full name", value: e.name },
          { label: "Employee ID", value: e.code },
          { label: "Email", value: e.email },
          { label: "Department", value: e.department },
        ]}
      />
    </>

  );
}
