import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Award,
  CheckCircle2,
  Clock,
  Flame,
  LineChart as LineChartIcon,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCENT, GRID_STROKE, axisStyle, chartColorAt, tooltipStyle } from "@/components/reports/chart-theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employee/statistics")({
  head: () => ({
    meta: [
      { title: "Statistics — Poll" },
      { name: "description", content: "Track your task completion, points, and performance trends." },
      { property: "og:title", content: "Statistics — Poll" },
      { property: "og:description", content: "Track your task completion, points, and performance trends." },
    ],
  }),
  component: StatisticsPage,
});

/* ---------------- Mock Datasets ---------------- */

const weeklyData7d = [
  { day: "Mon", points: 45, tasks: 2, hours: 6.5 },
  { day: "Tue", points: 80, tasks: 3, hours: 7.2 },
  { day: "Wed", points: 110, tasks: 4, hours: 8.0 },
  { day: "Thu", points: 65, tasks: 2, hours: 5.5 },
  { day: "Fri", points: 140, tasks: 5, hours: 8.5 },
  { day: "Sat", points: 30, tasks: 1, hours: 2.0 },
  { day: "Sun", points: 0, tasks: 0, hours: 0 },
];

const weeklyTrend30d = [
  { week: "Week 1", points: 310, tasks: 9, completionRate: 95 },
  { week: "Week 2", points: 380, tasks: 11, completionRate: 100 },
  { week: "Week 3", points: 290, tasks: 8, completionRate: 90 },
  { week: "Week 4", points: 440, tasks: 14, completionRate: 98 },
];

const trend90d = [
  { week: "W1", points: 210, tasks: 6 },
  { week: "W2", points: 280, tasks: 8 },
  { week: "W3", points: 340, tasks: 10 },
  { week: "W4", points: 300, tasks: 9 },
  { week: "W5", points: 410, tasks: 12 },
  { week: "W6", points: 380, tasks: 11 },
  { week: "W7", points: 460, tasks: 13 },
  { week: "W8", points: 420, tasks: 12 },
  { week: "W9", points: 490, tasks: 14 },
  { week: "W10", points: 510, tasks: 15 },
  { week: "W11", points: 470, tasks: 13 },
  { week: "W12", points: 560, tasks: 16 },
];

const categoryMix = [
  { name: "Engineering", value: 18, points: 620, color: "oklch(0.72 0.19 45)" },
  { name: "Bug Fixes", value: 12, points: 380, color: "oklch(0.68 0.16 265)" },
  { name: "Code Review", value: 8, points: 240, color: "oklch(0.72 0.16 165)" },
  { name: "Documentation", value: 4, points: 180, color: "oklch(0.78 0.16 85)" },
];

const skillsRadar = [
  { skill: "Speed", score: 92, fullMark: 100 },
  { skill: "Quality", score: 96, fullMark: 100 },
  { skill: "Accuracy", score: 88, fullMark: 100 },
  { skill: "Complexity", score: 84, fullMark: 100 },
  { skill: "Consistency", score: 94, fullMark: 100 },
  { skill: "Collaboration", score: 90, fullMark: 100 },
];

const monthlyComparison = [
  { month: "May", completed: 28, points: 950, avgDays: 2.3 },
  { month: "Jun", completed: 34, points: 1180, avgDays: 2.0 },
  { month: "Jul", completed: 38, points: 1310, avgDays: 1.9 },
  { month: "Aug", completed: 42, points: 1420, avgDays: 1.8 },
];

const achievements = [
  {
    icon: Trophy,
    title: "Century Club",
    desc: "Earned over 1,000+ lifetime reward points",
    date: "Unlocked Aug 12",
    accent: "text-warning bg-warning/15 border-warning/30",
  },
  {
    icon: Zap,
    title: "Speed Demon",
    desc: "Completed 5 high-priority tasks in under 24 hours",
    date: "Unlocked Aug 24",
    accent: "text-primary bg-primary/15 border-primary/30",
  },
  {
    icon: Target,
    title: "Flawless Streak",
    desc: "15 consecutive task submissions approved without revision",
    date: "Unlocked Sep 01",
    accent: "text-success bg-success/15 border-success/30",
  },
  {
    icon: Flame,
    title: "10-Day Warrior",
    desc: "Active daily streak maintained for 10+ consecutive days",
    date: "Unlocked Aug 30",
    accent: "text-warning bg-warning/15 border-warning/30",
  },
];

/* ---------------- Main Component ---------------- */

function StatisticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  const trendData = useMemo(() => {
    if (timeRange === "7d") return weeklyData7d;
    if (timeRange === "90d") return trend90d;
    return weeklyTrend30d;
  }, [timeRange]);

  const xKey = timeRange === "7d" ? "day" : "week";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header with Time Range Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Statistics"
          subtitle="Your personal performance, points, and trends."
        />
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as "7d" | "30d" | "90d")}>
            <SelectTrigger className="w-[160px] rounded-full border-border/60 bg-card/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top KPIs Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total points earned"
          value="1,420"
          icon={Sparkles}
          delta={12.4}
          accent="primary"
          hint="Top 5% in organization"
        />
        <StatCard
          label="Tasks completed"
          value="42"
          icon={CheckCircle2}
          delta={8.5}
          accent="success"
          hint="4 in review right now"
        />
        <StatCard
          label="Avg. turnaround"
          value="1.8 d"
          icon={Clock}
          delta={-14.2}
          accent="info"
          hint="0.4 days faster than average"
        />
        <StatCard
          label="Active streak"
          value="12 days"
          icon={Flame}
          accent="warning"
          hint="Personal record: 19 days"
        />
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Output & Points Velocity */}
        <div className="glass flex flex-col justify-between rounded-2xl p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-semibold">Points velocity & output</h3>
              <p className="text-xs text-muted-foreground">
                {timeRange === "7d"
                  ? "Points earned and tasks finished each day this week"
                  : timeRange === "90d"
                    ? "Rolling 12-week points velocity"
                    : "Points and task output over the last 4 weeks"}
              </p>
            </div>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              <TrendingUp className="mr-1 h-3 w-3" /> +16.2% vs prev period
            </Badge>
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="ptsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey={xKey} {...axisStyle} tickLine={false} axisLine={false} />
                <YAxis {...axisStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area
                  name="Points earned"
                  type="monotone"
                  dataKey="points"
                  stroke={ACCENT}
                  strokeWidth={2.5}
                  fill="url(#ptsGrad)"
                />
                <Line
                  name="Tasks completed"
                  type="monotone"
                  dataKey="tasks"
                  stroke="oklch(0.68 0.16 265)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "oklch(0.68 0.16 265)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Category Distribution */}
        <div className="glass flex flex-col justify-between rounded-2xl p-5">
          <div>
            <h3 className="font-display text-base font-semibold">Category breakdown</h3>
            <p className="text-xs text-muted-foreground">Volume & points distribution</p>
          </div>

          <div className="mt-2 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryMix}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  stroke="none"
                >
                  {categoryMix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || chartColorAt(index)} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-3 divide-y divide-border/40 text-xs">
            {categoryMix.map((item, idx) => (
              <li key={item.name} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color || chartColorAt(idx) }}
                  />
                  <span className="font-medium text-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{item.value} tasks</span>
                  <span className="font-semibold text-primary">{item.points} pts</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quality & Efficiency Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Approval Rate</span>
            <span className="font-semibold text-success">96.4%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: "96.4%" }} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">40 of 42 approved on 1st submission</p>
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>On-Time Delivery</span>
            <span className="font-semibold text-primary">92.8%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: "92.8%" }} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">39 tasks delivered before deadline</p>
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Quality Score</span>
            <span className="font-semibold text-warning">4.9 / 5.0</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-warning transition-all" style={{ width: "98%" }} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Based on admin reviewer ratings</p>
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Bonus Multiplier</span>
            <span className="font-semibold text-info">1.25×</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-info transition-all" style={{ width: "85%" }} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">+240 pts earned via streak & speed</p>
        </div>
      </div>

      {/* Skills Radar & Monthly Comparison */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Skill Proficiency Radar */}
        <div className="glass flex flex-col justify-between rounded-2xl p-5">
          <div>
            <h3 className="font-display text-base font-semibold">Skill competencies</h3>
            <p className="text-xs text-muted-foreground">Peer-reviewed performance dimensions</p>
          </div>

          <div className="mt-2 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skillsRadar}>
                <PolarGrid stroke={GRID_STROKE} />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "oklch(0.7 0 0)", fontSize: 11 }} />
                <PolarRadiusAxis stroke={GRID_STROKE} tick={false} axisLine={false} />
                <Radar
                  name="Proficiency"
                  dataKey="score"
                  stroke={ACCENT}
                  fill={ACCENT}
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Overall Mastery</span>
            <span className="font-semibold text-primary">90.6 / 100</span>
          </div>
        </div>

        {/* Month-over-Month Growth */}
        <div className="glass flex flex-col justify-between rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold">Month-over-month trajectory</h3>
              <p className="text-xs text-muted-foreground">Historical completion count & total reward points</p>
            </div>
            <Badge variant="outline" className="border-border/60">
              Last 4 months
            </Badge>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparison}>
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" {...axisStyle} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" {...axisStyle} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" {...axisStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="completed" name="Tasks completed" fill="oklch(0.68 0.16 265)" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="points" name="Points earned" fill={ACCENT} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Badges & Milestones Showcase */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold">Earned milestones</h3>
            <p className="text-xs text-muted-foreground">Recognition badges for exceptional performance</p>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            <Star className="mr-1 h-3 w-3" /> 4 of 6 unlocked
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {achievements.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.title}
                className="group relative flex flex-col justify-between rounded-xl border border-border/60 bg-card/40 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
              >
                <div>
                  <div className={cn("grid h-10 w-10 place-items-center rounded-xl border", a.accent)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-3 text-sm font-semibold text-foreground">{a.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{a.desc}</p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
                  <span>{a.date}</span>
                  <Award className="h-3.5 w-3.5 text-primary opacity-60 group-hover:opacity-100" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
