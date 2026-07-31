import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Award,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ListTodo,
  Plus,
  Shield,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
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
import {
  activityLogs,
  admins,
  departmentDistribution,
  employees,
  leaderboard,
  performanceTrend,
  tasks,
  weeklyCompletion,
} from "@/lib/mock-data";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-primary)",
];

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
};

function AdminOverview() {
  const activeTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "pending").length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pendingReviews = tasks.filter((t) => t.status === "completed").length + 3;
  const totalPoints = employees.reduce((s, e) => s + e.points, 0);

  const deadlines = [...tasks]
    .filter((t) => t.status !== "completed")
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
    .slice(0, 5);

  const latestEmployees = [...employees]
    .sort((a, b) => +new Date(a.joinedAt) - +new Date(b.joinedAt))
    .slice(0, 5);

  const topFive = leaderboard.slice(0, 5);

  const monthlyProductivity = [
    { month: "Feb", tasks: 68, points: 1420 },
    { month: "Mar", tasks: 82, points: 1680 },
    { month: "Apr", tasks: 74, points: 1520 },
    { month: "May", tasks: 96, points: 1980 },
    { month: "Jun", tasks: 110, points: 2340 },
    { month: "Jul", tasks: 128, points: 2720 },
  ];

  const departmentPerformance = [
    { name: "Engineering", completion: 88, tasks: 42 },
    { name: "Design", completion: 76, tasks: 24 },
    { name: "Marketing", completion: 64, tasks: 18 },
    { name: "Sales", completion: 82, tasks: 22 },
    { name: "Product", completion: 71, tasks: 16 },
    { name: "Support", completion: 58, tasks: 12 },
  ];

  const pointsDistribution = [
    { range: "0-500", value: 6 },
    { range: "500-1k", value: 12 },
    { range: "1k-1.5k", value: 18 },
    { range: "1.5k-2k", value: 9 },
    { range: "2k+", value: 4 },
  ];

  return (
    <>
      <PageHeader
        title="Admin overview"
        subtitle="A pulse on your organization — people, tasks, and momentum."
        actions={
          <>
            <Button variant="outline" className="rounded-md">
              <UserPlus className="mr-1.5 h-4 w-4" /> Invite
            </Button>
            <Button className="rounded-md shadow-glow">
              <Plus className="mr-1.5 h-4 w-4" /> New task
            </Button>
          </>
        }
      />

      {/* Top stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total employees" value={employees.length} icon={Users} delta={5.4} accent="primary" />
        <StatCard label="Total admins" value={admins.length} icon={Shield} delta={0} accent="info" />
        <StatCard label="Active tasks" value={activeTasks} icon={ListTodo} delta={3.2} accent="info" />
        <StatCard label="Pending reviews" value={pendingReviews} icon={ClipboardList} delta={-1.8} accent="warning" />
        <StatCard label="Completed tasks" value={completed} icon={CheckCircle2} delta={12.4} accent="success" />
        <StatCard label="Total reward points" value={totalPoints.toLocaleString()} icon={Trophy} delta={8.1} accent="warning" />
      </div>

      {/* Charts row 1: Task Completion + Points Distribution */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Task completion</h3>
              <p className="text-xs text-muted-foreground">Completed vs created over the last 7 days</p>
            </div>
            <Badge variant="secondary" className="rounded-full">This week</Badge>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyCompletion} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gComp" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCreate" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="created" stroke="var(--color-chart-2)" fill="url(#gCreate)" strokeWidth={2} />
                <Area type="monotone" dataKey="completed" stroke="var(--color-primary)" fill="url(#gComp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="font-display text-lg font-semibold">Points distribution</h3>
          <p className="text-xs text-muted-foreground">Employees by points range</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pointsDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="range" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2: Monthly Productivity + Department Performance */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Monthly productivity</h3>
              <p className="text-xs text-muted-foreground">Tasks shipped and points earned</p>
            </div>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="tasks" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="points" stroke="var(--color-chart-3)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="font-display text-lg font-semibold">Department performance</h3>
          <p className="text-xs text-muted-foreground">Completion rate by team</p>
          <ul className="mt-4 space-y-3">
            {departmentPerformance.map((d, i) => (
              <li key={d.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="font-medium">{d.name}</span>
                    <span className="text-xs text-muted-foreground">· {d.tasks} tasks</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{d.completion}%</span>
                </div>
                <Progress value={d.completion} className="h-1.5" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Widgets: Recent Activities + Upcoming Deadlines + Leaderboard preview */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="font-display text-lg font-semibold">Recent activities</h3>
            </div>
            <Link to="/admin/activity" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <ul className="mt-4 space-y-4">
            {activityLogs.slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent text-[11px] font-semibold">
                  {a.userAvatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <span className="font-medium">{a.user}</span>{a.userCode && <> <IdBadge id={a.userCode} /></>}{" "}
                    <span className="text-muted-foreground">{a.action}</span>{" "}
                    <span className="font-medium">{a.target}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(a.timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
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
            <Link to="/admin/tasks" className="text-xs text-primary hover:underline">All tasks</Link>
          </div>
          <ul className="mt-4 space-y-3">
            {deadlines.map((t) => {
              const days = Math.max(
                0,
                Math.ceil((+new Date(t.dueDate) - Date.now()) / (1000 * 60 * 60 * 24)),
              );
              const tone =
                days <= 2 ? "bg-destructive/15 text-destructive" : days <= 5 ? "bg-warning/15 text-warning" : "bg-success/15 text-success";
              return (
                <li key={t.id} className="rounded-xl border border-border/60 bg-card/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t.assignee} · {t.category}</p>
                    </div>
                    <span className={`shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-medium ${tone}`}>
                      {days === 0 ? "Today" : `${days}d`}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <h3 className="font-display text-lg font-semibold">Leaderboard</h3>
            </div>
            <Link to="/admin/leaderboard" className="text-xs text-primary hover:underline">Full board</Link>
          </div>
          <ul className="mt-4 space-y-3">
            {topFive.map((e) => (
              <li key={e.id} className="flex items-center gap-3">
                <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                  e.rank === 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}>
                  {e.rank}
                </div>
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent text-[11px] font-semibold">
                  {e.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.department}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                  <Star className="h-3 w-3 fill-primary" /> {e.points.toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Latest Employees + Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-display text-lg font-semibold">Latest employees</h3>
            </div>
            <Link to="/admin/employees" className="text-xs text-primary hover:underline">Manage</Link>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Department</th>
                  <th className="hidden px-4 py-2 text-left font-medium sm:table-cell">Joined</th>
                  <th className="px-4 py-2 text-right font-medium">Points</th>
                </tr>
              </thead>
              <tbody>
                {latestEmployees.map((e) => (
                  <tr key={e.id} className="border-t border-border/60 transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent text-[11px] font-semibold">
                          {e.avatar}
                        </div>
                        <div>
                          <p className="font-medium leading-tight">{e.name}</p>
                          <IdBadge id={e.code} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{e.department}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {new Date(e.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{e.points.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-display text-lg font-semibold">Quick actions</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Jump into common workflows</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <QuickAction to="/admin/tasks" icon={Plus} label="Create task" primary />
            <QuickAction to="/admin/employees" icon={UserPlus} label="Add employee" />
            <QuickAction to="/admin/task-reviews" icon={ClipboardList} label="Review tasks" />
            <QuickAction to="/admin/leaderboard" icon={Award} label="Award points" />
            <QuickAction to="/admin/reports" icon={Activity} label="View reports" />
            <QuickAction to="/admin/admins" icon={Shield} label="Manage admins" />
          </div>
          <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">Weekly momentum</p>
            <p className="mt-2 font-display text-2xl font-semibold">
              +{performanceTrend[performanceTrend.length - 1].points - performanceTrend[performanceTrend.length - 2].points} pts
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Compared to last week across all teams.</p>
          </div>
        </div>
      </div>

      {/* Department pie */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">Task distribution by department</h3>
            <p className="text-xs text-muted-foreground">Where work is happening right now</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[280px_1fr] md:items-center">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={departmentDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {departmentDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {departmentDistribution.map((d, i) => (
              <li key={d.name} className="rounded-xl border border-border/60 bg-card/40 p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-muted-foreground">{d.name}</span>
                </div>
                <p className="mt-1 font-display text-lg font-semibold">{d.value}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  primary,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`group flex flex-col items-start gap-2 rounded-xl border p-3 transition-all hover:-translate-y-0.5 ${
        primary
          ? "border-primary/40 bg-primary/10 hover:bg-primary/15"
          : "border-border/60 bg-card/40 hover:bg-secondary/40"
      }`}
    >
      <div className={`grid h-8 w-8 place-items-center rounded-lg ${primary ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-xs font-medium leading-tight">{label}</span>
    </Link>
  );
}
