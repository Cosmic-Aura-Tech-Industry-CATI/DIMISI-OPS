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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { COLORS, tooltipStyle } from "./dashboard-data";
import type {
  DepartmentPerformanceItem,
  MonthlyProductivityItem,
  PointsDistributionItem,
  TaskCompletionChartItem,
  TaskDistributionItem,
} from "@/features/dashboard/types";

const axisProps = {
  stroke: "var(--color-muted-foreground)",
  tickLine: false,
  axisLine: false,
} as const;

export function TaskCompletionChart({ data = [] }: { data?: TaskCompletionChartItem[] }) {
  return (
    <div className="glass rounded-2xl p-5 lg:col-span-2">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Task completion</h3>
          <p className="text-xs text-muted-foreground">Completed vs created over the last 7 days</p>
        </div>
        <Badge variant="secondary" className="rounded-full">This week</Badge>
      </div>
      <div className="mt-4 h-64">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No task completion history recorded for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
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
              <XAxis dataKey="day" fontSize={12} {...axisProps} />
              <YAxis fontSize={12} {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="created" stroke="var(--color-chart-2)" fill="url(#gCreate)" strokeWidth={2} />
              <Area type="monotone" dataKey="completed" stroke="var(--color-primary)" fill="url(#gComp)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function PointsDistributionChart({ data = [] }: { data?: PointsDistributionItem[] }) {
  const chartData = data.map((d) => ({ range: d.range, value: d.count }));

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-display text-lg font-semibold">Points distribution</h3>
      <p className="text-xs text-muted-foreground">Employees by points range</p>
      <div className="mt-4 h-64">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No reward points distribution data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="range" fontSize={11} {...axisProps} />
              <YAxis fontSize={12} {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function MonthlyProductivityChart({ data = [] }: { data?: MonthlyProductivityItem[] }) {
  const chartData = data.map((d) => ({
    month: d.month,
    tasks: d.tasksShipped,
    points: d.pointsEarned,
  }));

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Monthly productivity</h3>
          <p className="text-xs text-muted-foreground">Tasks shipped and points earned</p>
        </div>
      </div>
      <div className="mt-4 h-64">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No productivity data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" fontSize={12} {...axisProps} />
              <YAxis fontSize={12} {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="tasks" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="points" stroke="var(--color-chart-3)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function DepartmentPerformanceList({ data = [] }: { data?: DepartmentPerformanceItem[] }) {
  const items = data.map((d) => ({
    name: d.department,
    tasks: d.tasks,
    completion: d.completionRate,
  }));

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-display text-lg font-semibold">Department performance</h3>
      <p className="text-xs text-muted-foreground">Completion rate by team</p>
      {items.length === 0 ? (
        <div className="mt-6 flex h-48 items-center justify-center text-xs text-muted-foreground">
          No department performance recorded yet
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((d, i) => (
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
      )}
    </div>
  );
}

export function DepartmentDistributionPanel({ data = [] }: { data?: TaskDistributionItem[] }) {
  const chartData = data.map((d) => ({ name: d.department, value: d.count }));

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Task distribution by department</h3>
          <p className="text-xs text-muted-foreground">Where work is happening right now</p>
        </div>
      </div>
      {chartData.length === 0 ? (
        <div className="mt-6 flex h-48 items-center justify-center text-xs text-muted-foreground">
          No tasks distributed across departments
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-[280px_1fr] md:items-center">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {chartData.map((d, i) => (
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
      )}
    </div>
  );
}


