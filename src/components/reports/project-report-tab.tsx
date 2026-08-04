import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { projectStatusLabel, projectStatusStyles } from "@/lib/project-store";
import { cn } from "@/lib/utils";
import { ACCENT, GRID_STROKE, axisStyle, chartColorAt, tooltipStyle } from "./chart-theme";
import { ChartPanel, ColorDot, CompletionMeter, TablePanel } from "./report-panels";
import type { ProjectReportRow } from "./use-report-data";

export function ProjectReportTab({
  rows,
  onDownload,
}: {
  rows: ProjectReportRow[];
  onDownload: () => void;
}) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel
          title="Tasks by project"
          subtitle="Completed vs. total tasks per project"
          dense
          bodyClassName="h-64"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" {...axisStyle} tickLine={false} axisLine={false} />
              <YAxis {...axisStyle} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="total" name="Total" fill="oklch(0.35 0 0)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill={ACCENT} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title="Workload share"
          subtitle="Distribution of tasks across projects"
          dense
          bodyClassName="h-64"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rows.filter((p) => p.total > 0)}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                stroke="none"
              >
                {rows.map((_, i) => (
                  <Cell key={i} fill={chartColorAt(i)} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <TablePanel
        title="Project performance"
        subtitle="Every project with live task counters"
        onDownload={onDownload}
      >
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
            {rows.map((p, i) => (
              <TableRow key={p.id} className="border-border/40">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ColorDot color={p.color ?? chartColorAt(i)} />
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
                  <CompletionMeter rate={p.rate} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TablePanel>
    </>
  );
}
