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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { performanceTrend, weeklyCompletion } from "@/lib/mock-data";
import { ACCENT, GRID_STROKE, axisStyle, chartColorAt, tooltipStyle } from "./chart-theme";
import { ChartPanel, ColorDot } from "./report-panels";
import type { TaskBucket } from "./use-report-data";

export function WeeklyCompletionChart() {
  return (
    <ChartPanel
      title="Weekly completion"
      subtitle="Completed vs. created tasks per weekday"
      className="lg:col-span-2"
      bodyClassName="h-72"
      aside={
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
          <TrendingUp className="mr-1 h-3 w-3" /> +14%
        </Badge>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={weeklyCompletion}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" {...axisStyle} tickLine={false} axisLine={false} />
          <YAxis {...axisStyle} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="created" fill="oklch(0.35 0 0)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="completed" fill={ACCENT} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export function TaskStatusMixChart({ taskReport }: { taskReport: TaskBucket[] }) {
  return (
    <ChartPanel title="Task status mix" subtitle="Breakdown across all tasks">
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
                <Cell key={i} fill={chartColorAt(i)} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-2 text-xs">
        {taskReport.map((t, i) => (
          <li key={t.key} className="flex items-center gap-2">
            <ColorDot color={chartColorAt(i)} />
            <span className="text-muted-foreground">{t.label}</span>
            <span className="ml-auto font-medium">{t.value}</span>
          </li>
        ))}
      </ul>
    </ChartPanel>
  );
}

export function PointsVelocityChart() {
  return (
    <ChartPanel
      title="Points velocity"
      subtitle="Weekly points earned org-wide"
      className="lg:col-span-2"
      bodyClassName="h-64"
      aside={<Badge variant="outline" className="border-border/60">Last 8 weeks</Badge>}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={performanceTrend}>
          <defs>
            <linearGradient id="rptPts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.5} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" {...axisStyle} tickLine={false} axisLine={false} />
          <YAxis {...axisStyle} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="points" stroke={ACCENT} strokeWidth={2} fill="url(#rptPts)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export function PriorityMixChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ChartPanel title="Priority mix" subtitle="Task load by priority" dense bodyClassName="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" {...axisStyle} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" width={70} {...axisStyle} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="value" fill={ACCENT} radius={[0, 8, 8, 0]} barSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export function ThroughputTrendChart() {
  return (
    <ChartPanel
      title="Tasks completed per week"
      subtitle="Rolling org-wide throughput"
      bodyClassName="h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={performanceTrend}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" {...axisStyle} tickLine={false} axisLine={false} />
          <YAxis {...axisStyle} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="tasks"
            stroke={ACCENT}
            strokeWidth={2.5}
            dot={{ r: 3, fill: ACCENT }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
