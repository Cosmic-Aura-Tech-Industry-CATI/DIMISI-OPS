import { useMemo } from "react";
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
import { useTasksQuery, useCompletedTasks, useAssignedTasks, getCategoryLabel } from "@/features/tasks";
import { AvailableTasks } from "@/components/available-tasks";
import { useAuth } from "@/lib/auth";
import {
  useEmployeeTasksDeadlinesQuery,
  useEmployeeProgressAnalyticsQuery,
} from "@/features/employee-dashboard";
import { useLeaderboardQuery } from "@/features/leaderboard";
import { usePersonalActivityQuery, type ActivityLog } from "@/features/activity";

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
  const { data: tasks = [] } = useTasksQuery({ page: 1 });
  const { data: completedTasks = [] } = useCompletedTasks();
  const { data: assignedTasks = [] } = useAssignedTasks();
  const { data: tasksDeadlines } = useEmployeeTasksDeadlinesQuery();
  const { data: analytics } = useEmployeeProgressAnalyticsQuery();
  const { data: activityData } = usePersonalActivityQuery({ limit: 6 });
  const { data: leaderboard = [] } = useLeaderboardQuery(100);

  const currentUserId = auth.user?.id || auth.user?._id || "";

  const allMyTasks = useMemo(() => {
    const map = new Map<string, (typeof tasks)[number]>();
    [...assignedTasks, ...completedTasks].forEach((t) => {
      const id = t.id || (t as unknown as { _id?: string })._id;
      if (id) map.set(id, t);
    });
    tasks.forEach((t) => {
      const isMine =
        (currentUserId && t.assigneeId === currentUserId) ||
        (auth.user?.name && t.assignee === auth.user.name) ||
        (auth.user?.email && t.assignee === auth.user.email);
      const id = t.id || (t as unknown as { _id?: string })._id;
      if (isMine && id && !map.has(id)) {
        map.set(id, t);
      }
    });
    return Array.from(map.values());
  }, [assignedTasks, completedTasks, tasks, currentUserId, auth.user?.name, auth.user?.email]);

  const mine = allMyTasks;

  const completed = useMemo(() => {
    if (completedTasks.length > 0) return completedTasks;
    return mine.filter((t) => t.status === "completed" || (t.status as string) === "Completed");
  }, [completedTasks, mine]);

  const pending = useMemo(() => {
    const activeFromAssigned = assignedTasks.filter(
      (t) =>
        (t.status || "").toLowerCase() !== "completed" &&
        (t.status || "").toLowerCase() !== "overdue"
    );
    if (activeFromAssigned.length > 0) return activeFromAssigned;

    const fromDeadlines = [
      ...(tasksDeadlines?.todayTasks || []),
      ...(tasksDeadlines?.upcomingDeadlines || []),
    ].filter((t) => {
      const s = (t.status || "").toLowerCase();
      return s !== "completed" && s !== "overdue";
    });
    if (fromDeadlines.length > 0) return fromDeadlines;

    return mine.filter(
      (t) =>
        t.status === "pending" ||
        t.status === "in_progress" ||
        (t.status as string) === "In Progress" ||
        (t.status as string) === "Assigned"
    );
  }, [assignedTasks, tasksDeadlines?.todayTasks, tasksDeadlines?.upcomingDeadlines, mine]);

  const displayToday = useMemo(() => {
    if (tasksDeadlines?.todayTasks && tasksDeadlines.todayTasks.length > 0) {
      return tasksDeadlines.todayTasks.filter((t) => {
        const s = (t.status || "").toLowerCase();
        return s !== "completed" && s !== "overdue";
      });
    }
    const pool = assignedTasks.length > 0 ? assignedTasks : mine;
    const now = Date.now();
    return pool
      .filter((t) => {
        const s = (t.status || "").toLowerCase();
        if (s === "completed" || s === "overdue") return false;
        if (t.dueDate && new Date(t.dueDate).getTime() < now) return false;
        return true;
      })
      .slice(0, 3);
  }, [tasksDeadlines?.todayTasks, assignedTasks, mine]);

  const displayDeadlines = useMemo(() => {
    if (tasksDeadlines?.upcomingDeadlines) {
      return tasksDeadlines.upcomingDeadlines.filter((t) => {
        const s = (t.status || "").toLowerCase();
        return s !== "completed" && s !== "overdue";
      });
    }
    const now = Date.now();
    return [...mine]
      .filter((t) => {
        const s = (t.status || "").toLowerCase();
        if (s === "completed" || s === "overdue") return false;
        if (t.dueDate && new Date(t.dueDate).getTime() < now) return false;
        return true;
      })
      .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
      .slice(0, 4);
  }, [tasksDeadlines?.upcomingDeadlines, mine]);

  const weekProgress = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayIndex);
    startOfWeek.setHours(0, 0, 0, 0);

    return days.map((day, idx) => {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(startOfWeek.getDate() + idx);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      // Tasks completed on this specific day
      const dayDone = mine.filter((t) => {
        const isDone = t.status === "completed" || (t.status as string) === "Completed";
        if (!isDone) return false;
        const d = t.updatedAt ? new Date(t.updatedAt) : t.dueDate ? new Date(t.dueDate) : t.createdAt ? new Date(t.createdAt) : null;
        return d ? d >= dayStart && d <= dayEnd : false;
      }).length;

      // Tasks planned/due on this specific day
      const dayPlannedFromTasks = mine.filter((t) => {
        const d = t.dueDate ? new Date(t.dueDate) : t.createdAt ? new Date(t.createdAt) : null;
        return d ? d >= dayStart && d <= dayEnd : false;
      }).length;

      const fromAnalytics = analytics?.weeklyProgress?.find((w) => w.day === day);
      const analyticPlanned = fromAnalytics ? fromAnalytics.planned : 0;
      const analyticCompleted = fromAnalytics ? fromAnalytics.completed : 0;

      const finalDone = Math.max(dayDone, analyticCompleted);
      const finalPlanned = Math.max(finalDone, dayPlannedFromTasks, analyticPlanned);

      return {
        day,
        done: finalDone,
        planned: finalPlanned,
      };
    });
  }, [mine, analytics?.weeklyProgress]);

  const monthlyGoal = analytics?.monthlyPerformance?.pointsGoal ?? 600;
  const monthlyPoints = analytics?.monthlyPerformance?.totalPoints ?? 0;
  const monthlyProgress = monthlyGoal > 0 ? Math.min(100, Math.round((monthlyPoints / monthlyGoal) * 100)) : 0;

  const avgPointsPerDay = analytics?.monthlyPerformance?.avgPointsPerDay !== undefined
    ? `${analytics.monthlyPerformance.avgPointsPerDay} pts`
    : "0 pts";
  const bestDayPoints = analytics?.monthlyPerformance?.bestDayPoints !== undefined
    ? `${analytics.monthlyPerformance.bestDayPoints} pts`
    : "0 pts";
  const tasksPerWeekAvg = analytics?.monthlyPerformance?.tasksPerWeekAvg !== undefined
    ? `${analytics.monthlyPerformance.tasksPerWeekAvg}`
    : "0";

  const currentMonthName = new Date().toLocaleDateString(undefined, { month: "short" });

  const userName = auth.user?.name || "Employee";
  const userAvatar = userName.slice(0, 2).toUpperCase();

  const myLeaderboardEntry = useMemo(() => {
    return leaderboard.find((item) => {
      const l = item as Record<string, unknown>;
      const lId = String(l.id || l._id || "");
      const lCode = String(l.empId || l.code || "");
      const lEmail = String(l.email || "").toLowerCase();
      const lName = String(l.name || "").toLowerCase();
      return (
        (currentUserId && (lId === currentUserId || lCode === currentUserId)) ||
        (auth.user?.email && lEmail === auth.user.email.toLowerCase()) ||
        (auth.user?.name && lName === auth.user.name.toLowerCase())
      );
    });
  }, [leaderboard, currentUserId, auth.user?.email, auth.user?.name]);

  const completedTasksPoints = useMemo(() => {
    return completed.reduce((sum, t) => {
      const rec = t as unknown as Record<string, unknown>;
      const pt = typeof t.points === "number" ? t.points : typeof rec.rewardPoints === "number" ? (rec.rewardPoints as number) : 0;
      return sum + pt;
    }, 0);
  }, [completed]);

  const userPoints = useMemo(() => {
    const userRec = auth.user as unknown as Record<string, unknown> | null;
    const fromAuth = typeof userRec?.points === "number" ? (userRec.points as number) : typeof userRec?.rewardPoints === "number" ? (userRec.rewardPoints as number) : undefined;
    const fromLeaderboard = myLeaderboardEntry?.points;
    const candidates = [fromAuth, fromLeaderboard, completedTasksPoints, monthlyPoints].filter(
      (v): v is number => typeof v === "number" && !isNaN(v) && v > 0
    );
    if (candidates.length > 0) {
      return Math.max(...candidates);
    }
    return fromAuth ?? monthlyPoints;
  }, [auth.user, myLeaderboardEntry, completedTasksPoints, monthlyPoints]);

  const performanceTrend = useMemo(() => {
    const weeks: { week: string; points: number; tasks: number }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const target = new Date(now);
      target.setDate(now.getDate() - i * 7);

      const start = new Date(target);
      start.setDate(target.getDate() - target.getDay() + (target.getDay() === 0 ? -6 : 1));
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const weekLabel = `W${Math.max(1, Math.ceil(target.getDate() / 7))} ${target.toLocaleDateString(undefined, { month: "short" })}`;
      const weekTasks = mine.filter((t) => {
        if (t.status !== "completed" && (t.status as string) !== "Completed") return false;
        const d = t.updatedAt ? new Date(t.updatedAt) : t.dueDate ? new Date(t.dueDate) : t.createdAt ? new Date(t.createdAt) : null;
        return d ? d >= start && d <= end : false;
      });

      const points = weekTasks.reduce((acc, t) => acc + (t.points || 0), 0);
      weeks.push({ week: weekLabel, points, tasks: weekTasks.length });
    }
    return weeks;
  }, [mine]);

  const activityLogs: ActivityLog[] = useMemo(() => {
    if (Array.isArray(activityData)) return activityData;
    const rec = activityData as unknown as { data?: ActivityLog[] };
    return rec?.data || [];
  }, [activityData]);

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
                You have{" "}
                <span className="font-medium text-foreground">
                  {pending.length} active {pending.length === 1 ? "task" : "tasks"}
                </span>{" "}
                on your plate. Keep it going.
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
        <StatCard label="Today's tasks" value={displayToday.length} icon={Target} accent="primary" />
        <StatCard label="Pending" value={pending.length} icon={Timer} accent="info" />
        <StatCard label="Completed" value={completed.length} icon={CheckCircle2} accent="success" />
        <StatCard label="Current points" value={userPoints.toLocaleString()} icon={Sparkles} accent="warning" />
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
            {displayToday.length === 0 && (
              <li className="rounded-xl border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
                All caught up — nothing on the docket today.
              </li>
            )}
            {displayToday.map((t) => (
              <li
                key={t.id}
                className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 p-3 transition-colors hover:bg-secondary/40"
              >
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      to="/employee/tasks/$id"
                      params={{ id: t.id || (t as any)._id }}
                      className="truncate text-sm font-medium hover:text-primary transition-colors"
                    >
                      {t.title}
                    </Link>
                    <span className={`shrink-0 rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusTone[t.status] ?? ""}`}>
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{t.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Due</p>
                  <p className="text-xs font-semibold">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "-"}
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
            {displayDeadlines.length === 0 && (
              <li className="rounded-xl border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
                No upcoming deadlines.
              </li>
            )}
            {displayDeadlines.map((t) => {
              const days = t.dueDate ? Math.max(0, Math.ceil((+new Date(t.dueDate) - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
              const tone = days <= 2 ? "bg-destructive/15 text-destructive" : days <= 5 ? "bg-warning/15 text-warning" : "bg-success/15 text-success";
              return (
                <li key={t.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/employee/tasks/$id"
                      params={{ id: t.id || (t as any)._id }}
                      className="truncate block text-sm font-medium hover:text-primary transition-colors"
                    >
                      {t.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{getCategoryLabel(t.category)}</p>
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
            <Badge variant="secondary" className="rounded-full">{currentMonthName}</Badge>
          </div>
          <div className="mt-6 flex items-center gap-5">
            <CircularProgress value={monthlyProgress} />
            <div>
              <p className="font-display text-2xl font-semibold">{monthlyPoints}</p>
              <p className="text-xs text-muted-foreground">of {monthlyGoal} pts goal</p>
              <p className="mt-2 text-xs text-success">
                {monthlyProgress >= 100 ? "Goal achieved!" : `${monthlyProgress}% completed`}
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <MiniStat label="Avg / day" value={avgPointsPerDay} />
            <MiniStat label="Best day" value={bestDayPoints} />
            <MiniStat label="Tasks / wk" value={tasksPerWeekAvg} />
            <MiniStat label="Completed" value={`${completed.length} tasks`} />
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
          {activityLogs.length === 0 && (
            <li className="text-xs text-muted-foreground">No recent activity logs found.</li>
          )}
          {activityLogs.map((a) => {
            const actorName = typeof a.actorId === "object" && a.actorId?.name ? a.actorId.name : userName;
            const actorCode = typeof a.actorId === "object" ? a.actorId?.empId : undefined;
            const actionText = (a.action || "").replace(/_/g, " ");
            const targetText = (a.metadata?.title as string) || (a.metadata?.name as string) || a.entityType || "";
            return (
              <li key={a._id || a.id} className="relative">
                <span className="absolute -left-[29px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-background bg-primary shadow-glow" />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm">
                    <span className="font-medium">{actorName}</span>
                    {actorCode && <> <IdBadge id={actorCode} /></>}{" "}
                    <span className="text-muted-foreground">{actionText}</span>{" "}
                    <span className="font-medium">{targetText}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.createdAt ? new Date(a.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </>
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
