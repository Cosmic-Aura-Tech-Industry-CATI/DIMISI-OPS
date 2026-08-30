import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Award,
  CalendarClock,
  CheckCircle2,
  Clock,
  Flame,
  ListTodo,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IdBadge } from "@/components/id-badge";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { activityLogs, currentEmployee, performanceTrend } from "@/lib/mock-data";
import { useTasksQuery } from "@/features/tasks";
import { useAuth } from "@/lib/auth";
import { AvailableTasks } from "@/components/available-tasks";

export const Route = createFileRoute("/employee/")({
  component: EmployeeOverview,
});

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
};

const statusTone: Record<string, string> = {
  completed: "bg-success/15 text-success",
  in_progress: "bg-info/15 text-info",
  pending: "bg-warning/15 text-warning",
  overdue: "bg-destructive/15 text-destructive",
};

function EmployeeOverview() {
  const auth = useAuth();
  const { data: tasks = [] } = useTasksQuery();
  const currentUserId = auth.user?.id || auth.user?._id || currentEmployee.id;

  const mine = tasks.filter((t) => {
    return (
      t.assigneeId === currentUserId ||
      (auth.user?.name && t.assignee === auth.user.name) ||
      (auth.user?.email && t.assignee === auth.user.email)
    );
  });
  const completed = mine.filter((t) => t.status === "completed" || (t.status as string) === "Completed");
  const pending = mine.filter((t) => t.status === "pending" || t.status === "in_progress" || (t.status as string) === "In Progress" || (t.status as string) === "Assigned");
  const today = mine
    .filter((t) => t.status !== "completed" && (t.status as string) !== "Completed")
    .slice(0, 3);
  const deadlines = [...mine]
    .filter((t) => t.status !== "completed" && (t.status as string) !== "Completed" && t.dueDate)
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
    .slice(0, 4);

  const goal = 50;
  const progress = Math.min(100, Math.round((completed.length / goal) * 100));
  const monthlyGoal = 600;
  const monthlyPoints = 482;
  const monthlyProgress = Math.round((monthlyPoints / monthlyGoal) * 100);

  const weekProgress = [
    { day: "Mon", done: 3, planned: 4 },
    { day: "Tue", done: 5, planned: 5 },
    { day: "Wed", done: 4, planned: 6 },
    { day: "Thu", done: 6, planned: 5 },
    { day: "Fri", done: 2, planned: 4 },
    { day: "Sat", done: 1, planned: 2 },
    { day: "Sun", done: 0, planned: 1 },
  ];

  const userName = auth.user?.name || "Employee";
  const userAvatar = userName.slice(0, 2).toUpperCase();
  const userPoints = (auth.user as any)?.rewardPoints ?? (auth.user as any)?.points ?? 0;

  return (
    <>
      {/* Welcome Card */}
      <div className="glass relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div
          aria-hidden
          className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-lg font-bold text-primary-foreground shadow-glow">
              {userAvatar}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                Welcome back
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Hi, {userName.split(" ")[0]} 👋
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                You have <span className="font-medium text-foreground">{pending.length} active tasks</span> on your plate. Keep it going.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="rounded-md">
              <Link to="/employee/tasks">
                <ListTodo className="mr-1.5 h-4 w-4" /> My tasks
              </Link>
            </Button>
            <Button asChild className="rounded-md shadow-glow">
              <Link to="/employee/performance">
                View performance <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <AvailableTasks />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's tasks" value={today.length} icon={Target} delta={0} accent="primary" />
        <StatCard label="Pending" value={pending.length} icon={Timer} delta={-2.1} accent="info" />
        <StatCard label="Completed" value={completed.length} icon={CheckCircle2} delta={12.5} accent="success" />
        <StatCard label="Current points" value={userPoints.toLocaleString()} icon={Sparkles} delta={6.2} accent="warning" />
      </div>

      {/* Today's Tasks + Upcoming Deadlines */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary" />
              <h3 className="font-display text-lg font-semibold">Assigned tasks</h3>
            </div>
            <Link to="/employee/tasks" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {today.length === 0 && (
              <li className="rounded-xl border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
                All caught up — nothing on the docket today.
              </li>
            )}
            {today.map((t) => (
              <li
                key={t.id}
                className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 p-3 transition-colors hover:bg-secondary/40"
              >
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <span className={`shrink-0 rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusTone[t.status] ?? ""}`}>
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{t.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Due</p>
                  <p className="text-xs font-semibold">
                    {new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h3 className="font-display text-lg font-semibold">Upcoming deadlines</h3>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {deadlines.map((t) => {
              const days = Math.max(0, Math.ceil((+new Date(t.dueDate) - Date.now()) / (1000 * 60 * 60 * 24)));
              const tone = days <= 2 ? "bg-destructive/15 text-destructive" : days <= 5 ? "bg-warning/15 text-warning" : "bg-success/15 text-success";
              return (
                <li key={t.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.category}</p>
                  </div>
                  <span className={`rounded-sm px-2 py-0.5 text-[11px] font-medium ${tone}`}>
                    {days === 0 ? "Today" : `${days}d`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>


      {/* Monthly Performance + Weekly Progress */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <h3 className="font-display text-lg font-semibold">Monthly performance</h3>
            </div>
            <Badge variant="secondary" className="rounded-full">Jul</Badge>
          </div>
          <div className="mt-6 flex items-center gap-5">
            <CircularProgress value={monthlyProgress} />
            <div>
              <p className="font-display text-2xl font-semibold">{monthlyPoints}</p>
              <p className="text-xs text-muted-foreground">of {monthlyGoal} pts goal</p>
              <p className="mt-2 text-xs text-success">On track · 4 days ahead</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <MiniStat label="Avg / day" value="16 pts" />
            <MiniStat label="Best day" value="42 pts" />
            <MiniStat label="Tasks / wk" value="18" />
            <MiniStat label="Rating" value="4.8 / 5" />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="font-display text-lg font-semibold">Weekly progress</h3>
            </div>
            <p className="text-xs text-muted-foreground">Planned vs completed</p>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekProgress} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="planned" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="done" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Graph */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">Performance graph</h3>
            <p className="text-xs text-muted-foreground">Points and tasks over the last 8 weeks</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Points</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--color-chart-3)]" /> Tasks</span>
          </div>
        </div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceTrend} margin={{ left: 0, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="pts" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="points" stroke="var(--color-primary)" fill="url(#pts)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="tasks" stroke="var(--color-chart-3)" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="font-display text-lg font-semibold">Activity timeline</h3>
          </div>
          <Link to="/employee/history" className="text-xs text-primary hover:underline">Full history</Link>
        </div>
        <ol className="mt-6 relative space-y-6 border-l border-border/60 pl-6">
          {activityLogs.slice(0, 6).map((a) => (
            <li key={a.id} className="relative">
              <span className="absolute -left-[29px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-background bg-primary shadow-glow" />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm">
                  <span className="font-medium">{a.user}</span>{a.userCode && <> <IdBadge id={a.userCode} /></>}{" "}
                  <span className="text-muted-foreground">{a.action}</span>{" "}
                  <span className="font-medium">{a.target}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

function ProgressPanel({
  icon: Icon,
  title,
  hint,
  value,
  suffix,
  progress,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
  value: number;
  suffix: string;
  progress: number;
  accent: "success" | "info";
}) {
  const bg = accent === "success" ? "bg-success/15 text-success" : "bg-info/15 text-info";
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`grid h-8 w-8 place-items-center rounded-lg ${bg}`}>
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="font-display text-sm font-semibold">{title}</h3>
        </div>
        <span className="text-xs text-muted-foreground">{progress}%</span>
      </div>
      <p className="mt-4 font-display text-3xl font-semibold">
        {value} <span className="text-sm font-medium text-muted-foreground">{suffix}</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      <Progress value={progress} className="mt-3 h-1.5" />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function CircularProgress({ value }: { value: number }) {
  const size = 96;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-border)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-lg font-semibold">{value}%</span>
      </div>
    </div>
  );
}
