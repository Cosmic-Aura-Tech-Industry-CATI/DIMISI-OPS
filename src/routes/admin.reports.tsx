import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Trophy,
  ListTodo,
  Users,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Filter,
} from "lucide-react";
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
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  employees,
  tasks,
  performanceTrend,
  weeklyCompletion,
  departmentDistribution,
} from "@/lib/mock-data";
import { useProjects, projectStatusLabel, projectStatusStyles } from "@/lib/project-store";
import { projectStats } from "@/lib/projects";
import { useAllTasks } from "@/lib/task-store";
import { cn } from "@/lib/utils";
import { logAudit } from "@/lib/audit-log";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Poll" },
      { name: "description", content: "Deep analytics across employees, tasks, and departments." },
      { property: "og:title", content: "Reports — Poll" },
      { property: "og:description", content: "Deep analytics across employees, tasks, and departments." },
    ],
  }),
  component: ReportsPage,
});

const CHART_COLORS = [
  "oklch(0.72 0.19 45)",
  "oklch(0.68 0.16 265)",
  "oklch(0.72 0.16 165)",
  "oklch(0.78 0.16 85)",
  "oklch(0.68 0.18 320)",
  "oklch(0.7 0.15 200)",
];

const tooltipStyle = {
  background: "oklch(0.18 0 0)",
  border: "1px solid oklch(0.28 0 0)",
  borderRadius: 12,
  fontSize: 12,
};
const axisStyle = { stroke: "oklch(0.65 0 0)", fontSize: 11 };

function ReportsPage() {
  const [range, setRange] = useState("month");
  const projectList = useProjects();
  const liveTasks = useAllTasks();

  const projectReport = useMemo(
    () =>
      projectList.map((p) => {
        const s = projectStats(liveTasks, p.id);
        return {
          id: p.id,
          code: p.code,
          name: p.name,
          manager: p.manager,
          status: p.status,
          color: p.color,
          total: s.total,
          available: s.available,
          inReview: s.inReview,
          completed: s.completed,
          pending: s.pending,
          employees: s.employees,
          rate: s.total ? Math.round((s.completed / s.total) * 100) : 0,
        };
      }),
    [projectList, liveTasks],
  );



  // Aggregations
  const employeeReport = useMemo(
    () =>
      employees.map((e) => {
        const mine = tasks.filter((t) => t.assigneeId === e.id);
        const completed = mine.filter((t) => t.status === "completed").length;
        const overdue = mine.filter((t) => t.status === "overdue").length;
        const rate = mine.length ? Math.round((completed / mine.length) * 100) : 0;
        return {
          id: e.id,
          name: e.name,
          avatar: e.avatar,
          department: e.department,
          points: e.points,
          assigned: mine.length,
          completed,
          overdue,
          rate,
        };
      }).sort((a, b) => b.points - a.points),
    [],
  );

  const taskReport = useMemo(() => {
    const buckets: Record<string, number> = { pending: 0, in_progress: 0, completed: 0, overdue: 0, available: 0, assigned: 0 };
    for (const t of tasks) buckets[t.status]++;
    return [
      { label: "Pending", key: "pending", value: buckets.pending, tone: "text-primary" },
      { label: "In Progress", key: "in_progress", value: buckets.in_progress, tone: "text-primary" },
      { label: "Completed", key: "completed", value: buckets.completed, tone: "text-primary" },
      { label: "Overdue", key: "overdue", value: buckets.overdue, tone: "text-primary" },
    ];
  }, []);

  const priorityMix = useMemo(() => {
    const p = { high: 0, medium: 0, low: 0 };
    for (const t of tasks) p[t.priority]++;
    return [
      { name: "High", value: p.high },
      { name: "Medium", value: p.medium },
      { name: "Low", value: p.low },
    ];
  }, []);

  const departmentReport = useMemo(() => {
    const map = new Map<string, { department: string; employees: number; points: number; completed: number; assigned: number }>();
    for (const e of employees) {
      const mine = tasks.filter((t) => t.assigneeId === e.id);
      const cur = map.get(e.department) ?? { department: e.department, employees: 0, points: 0, completed: 0, assigned: 0 };
      cur.employees += 1;
      cur.points += e.points;
      cur.assigned += mine.length;
      cur.completed += mine.filter((t) => t.status === "completed").length;
      map.set(e.department, cur);
    }
    return Array.from(map.values())
      .map((d) => ({ ...d, rate: d.assigned ? Math.round((d.completed / d.assigned) * 100) : 0 }))
      .sort((a, b) => b.points - a.points);
  }, []);

  const departmentRadar = useMemo(
    () =>
      departmentReport.map((d) => ({
        department: d.department,
        Score: Math.round((d.rate + Math.min(100, d.points / 20)) / 2),
      })),
    [departmentReport],
  );

  const kpis = useMemo(() => {
    const totalPoints = employees.reduce((s, e) => s + e.points, 0);
    const totalCompleted = tasks.filter((t) => t.status === "completed").length;
    const avgRate = Math.round(
      employeeReport.reduce((s, e) => s + e.rate, 0) / (employeeReport.length || 1),
    );
    return { totalPoints, totalCompleted, avgRate };
  }, [employeeReport]);

  const download = (label: string) => (
    logAudit({ category: "reports", action: "Exported Report", target: label, details: `${label} export requested.` }),
    toast.success(`${label} export queued`, { description: "Your file will download shortly (demo)." }));

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Deep dives across employees, tasks, and departments."
        actions={
          <>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-36 rounded-full">
                <Filter className="mr-1 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="quarter">This quarter</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-md shadow-glow">
                  <Download className="mr-1.5 h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => download("CSV")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => download("Excel")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => download("PDF")}>
                  <FileText className="mr-2 h-4 w-4" /> Download PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total employees" value={employees.length} icon={Users} delta={8} />
        <StatCard label="Tasks completed" value={kpis.totalCompleted} icon={CheckCircle2} delta={14} accent="success" />
        <StatCard label="Avg completion rate" value={`${kpis.avgRate}%`} icon={TrendingUp} delta={5} accent="info" />
        <StatCard label="Total reward points" value={kpis.totalPoints.toLocaleString()} icon={Trophy} delta={22} accent="warning" />
      </div>

      {/* Overview charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Weekly completion</h3>
              <p className="text-xs text-muted-foreground">Completed vs. created tasks per weekday</p>
            </div>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              <TrendingUp className="mr-1 h-3 w-3" /> +14%
            </Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyCompletion}>
                <CartesianGrid stroke="oklch(0.28 0 0)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" {...axisStyle} tickLine={false} axisLine={false} />
                <YAxis {...axisStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="created" fill="oklch(0.35 0 0)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="completed" fill="oklch(0.72 0.19 45)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Task status mix</h3>
              <p className="text-xs text-muted-foreground">Breakdown across all tasks</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskReport}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  stroke="none"
                >
                  {taskReport.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {taskReport.map((t, i) => (
              <li key={t.key} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-muted-foreground">{t.label}</span>
                <span className="ml-auto font-medium">{t.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Points velocity</h3>
              <p className="text-xs text-muted-foreground">Weekly points earned org-wide</p>
            </div>
            <Badge variant="outline" className="border-border/60">Last 8 weeks</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTrend}>
                <defs>
                  <linearGradient id="rptPts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.19 45)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.72 0.19 45)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.28 0 0)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" {...axisStyle} tickLine={false} axisLine={false} />
                <YAxis {...axisStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="points" stroke="oklch(0.72 0.19 45)" strokeWidth={2} fill="url(#rptPts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="mb-2">
            <h3 className="font-display text-lg font-semibold">Priority mix</h3>
            <p className="text-xs text-muted-foreground">Task load by priority</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityMix} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid stroke="oklch(0.28 0 0)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" {...axisStyle} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={70} {...axisStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="oklch(0.72 0.19 45)" radius={[0, 8, 8, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Report tabs */}
      <Tabs defaultValue="employee" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="employee">Employee Reports</TabsTrigger>
            <TabsTrigger value="task">Task Reports</TabsTrigger>
            <TabsTrigger value="project">Project Reports</TabsTrigger>
            <TabsTrigger value="department">Department Reports</TabsTrigger>
          </TabsList>
        </div>

        {/* Employee report */}
        <TabsContent value="employee" className="space-y-4">
          <div className="glass overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h3 className="font-display text-base font-semibold">Employee performance</h3>
                <p className="text-xs text-muted-foreground">Ranked by points earned</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-md" onClick={() => download("Employee report")}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Assigned</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead className="w-48">Completion</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeReport.map((e) => (
                    <TableRow key={e.id} className="border-border/40">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent text-xs font-semibold">
                            {e.avatar}
                          </div>
                          <div className="font-medium">{e.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.department}</TableCell>
                      <TableCell className="text-right text-sm">{e.assigned}</TableCell>
                      <TableCell className="text-right text-sm text-primary">{e.completed}</TableCell>
                      <TableCell className="text-right text-sm text-primary">{e.overdue}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${e.rate}%` }} />
                          </div>
                          <span className="w-10 text-right text-xs text-muted-foreground">{e.rate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-display font-semibold">
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Sparkles className="h-3 w-3" /> {e.points.toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Task report */}
        <TabsContent value="task" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-4">
            {taskReport.map((t) => (
              <div key={t.key} className="glass rounded-2xl p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.label}</div>
                <div className={cn("mt-1 font-display text-3xl font-semibold", t.tone)}>{t.value}</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.min(100, (t.value / tasks.length) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="glass overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h3 className="font-display text-base font-semibold">All tasks</h3>
                <p className="text-xs text-muted-foreground">Status, priority, and reward across the workspace</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-md" onClick={() => download("Task report")}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead>Task</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((t) => (
                    <TableRow key={t.id} className="border-border/40">
                      <TableCell className="font-medium">{t.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.assignee}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.category}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize border",
                            t.priority === "high" && "border-primary/30 bg-primary/10 text-primary",
                            t.priority === "medium" && "border-primary/30 bg-primary/10 text-primary",
                            t.priority === "low" && "border-primary/30 bg-primary/10 text-primary",
                          )}
                        >
                          {t.priority}
                        </Badge>
                      </TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                      <TableCell className="text-right font-medium">+{t.points}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(t.dueDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Project report */}
        <TabsContent value="project" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="glass rounded-2xl p-6">
              <div className="mb-2">
                <h3 className="font-display text-lg font-semibold">Tasks by project</h3>
                <p className="text-xs text-muted-foreground">Completed vs. total tasks per project</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectReport}>
                    <CartesianGrid stroke="oklch(0.28 0 0)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" {...axisStyle} tickLine={false} axisLine={false} />
                    <YAxis {...axisStyle} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="total" name="Total" fill="oklch(0.35 0 0)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="oklch(0.72 0.19 45)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="mb-2">
                <h3 className="font-display text-lg font-semibold">Workload share</h3>
                <p className="text-xs text-muted-foreground">Distribution of tasks across projects</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectReport.filter((p) => p.total > 0)}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {projectReport.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h3 className="font-display text-base font-semibold">Project performance</h3>
                <p className="text-xs text-muted-foreground">Every project with live task counters</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-md" onClick={() => download("Project report")}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead>Project</TableHead>
                    <TableHead>Project ID</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">In review</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Members</TableHead>
                    <TableHead className="w-48">Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectReport.map((p, i) => (
                    <TableRow key={p.id} className="border-border/40">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: p.color ?? CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.code}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.manager ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("capitalize", projectStatusStyles[p.status])}>
                          {projectStatusLabel[p.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">{p.total}</TableCell>
                      <TableCell className="text-right text-sm">{p.available}</TableCell>
                      <TableCell className="text-right text-sm">{p.inReview}</TableCell>
                      <TableCell className="text-right text-sm text-primary">{p.completed}</TableCell>
                      <TableCell className="text-right text-sm">{p.employees}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                              style={{ width: `${p.rate}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs text-muted-foreground">{p.rate}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Department report */}
        <TabsContent value="department" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="glass rounded-2xl p-6">
              <div className="mb-2">
                <h3 className="font-display text-lg font-semibold">Headcount by department</h3>
                <p className="text-xs text-muted-foreground">Active employees per department</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentDistribution}>
                    <CartesianGrid stroke="oklch(0.28 0 0)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" {...axisStyle} tickLine={false} axisLine={false} />
                    <YAxis {...axisStyle} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {departmentDistribution.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="mb-2">
                <h3 className="font-display text-lg font-semibold">Performance radar</h3>
                <p className="text-xs text-muted-foreground">Blended completion + points score</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={departmentRadar}>
                    <PolarGrid stroke="oklch(0.28 0 0)" />
                    <PolarAngleAxis dataKey="department" tick={{ fill: "oklch(0.75 0 0)", fontSize: 11 }} />
                    <Radar
                      name="Score"
                      dataKey="Score"
                      stroke="oklch(0.72 0.19 45)"
                      fill="oklch(0.72 0.19 45)"
                      fillOpacity={0.35}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h3 className="font-display text-base font-semibold">Department performance</h3>
                <p className="text-xs text-muted-foreground">Aggregated across all employees per department</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-md" onClick={() => download("Department report")}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Employees</TableHead>
                    <TableHead className="text-right">Assigned</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="w-48">Completion</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentReport.map((d, i) => {
                    const up = i % 2 === 0;
                    return (
                      <TableRow key={d.department} className="border-border/40">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="font-medium">{d.department}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">{d.employees}</TableCell>
                        <TableCell className="text-right text-sm">{d.assigned}</TableCell>
                        <TableCell className="text-right text-sm text-primary">{d.completed}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${d.rate}%` }} />
                            </div>
                            <span className="w-10 text-right text-xs text-muted-foreground">{d.rate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-display font-semibold text-primary">{d.points.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={cn(
                              "gap-1",
                              up ? "border-primary/30 bg-primary/10 text-primary" : "border-primary/30 bg-primary/10 text-primary",
                            )}
                          >
                            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {up ? "+" : "-"}{4 + i}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Trend line at bottom */}
      <div className="glass rounded-2xl p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">Tasks completed per week</h3>
            <p className="text-xs text-muted-foreground">Rolling org-wide throughput</p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceTrend}>
              <CartesianGrid stroke="oklch(0.28 0 0)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" {...axisStyle} tickLine={false} axisLine={false} />
              <YAxis {...axisStyle} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="tasks" stroke="oklch(0.72 0.19 45)" strokeWidth={2.5} dot={{ r: 3, fill: "oklch(0.72 0.19 45)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ListTodo className="hidden" />
    </>
  );
}
