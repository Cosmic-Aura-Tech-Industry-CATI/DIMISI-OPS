import { TrendingDown, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
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
import { cn } from "@/lib/utils";
import { ACCENT, GRID_STROKE, axisStyle, chartColorAt, tooltipStyle } from "./chart-theme";
import { ChartPanel, ColorDot, CompletionMeter, TablePanel } from "./report-panels";
import type { DepartmentReportRow } from "./use-report-data";

const TREND_BADGE = "border-primary/30 bg-primary/10 text-primary";

export function DepartmentReportTab({
  rows = [],
  radar = [],
  onDownload,
}: {
  rows?: DepartmentReportRow[];
  radar?: { department: string; Score: number }[];
  onDownload: () => void;
}) {
  const headcountData = rows.map((r) => ({
    name: r.department,
    value: r.employees,
  }));

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel
          title="Headcount by department"
          subtitle="Active employees per department"
          dense
          bodyClassName="h-64"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={headcountData}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" {...axisStyle} tickLine={false} axisLine={false} />
              <YAxis {...axisStyle} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {headcountData.map((_, i) => (
                  <Cell key={i} fill={chartColorAt(i)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title="Performance radar"
          subtitle="Blended completion + points score"
          dense
          bodyClassName="h-64"
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radar}>
              <PolarGrid stroke={GRID_STROKE} />
              <PolarAngleAxis dataKey="department" tick={{ fill: "oklch(0.75 0 0)", fontSize: 11 }} />
              <Radar name="Score" dataKey="Score" stroke={ACCENT} fill={ACCENT} fillOpacity={0.35} />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <TablePanel
        title="Department performance"
        subtitle="Aggregated across all employees per department"
        onDownload={onDownload}
      >
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
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                  No department metrics found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((d, i) => {
                const up = i % 2 === 0;
                return (
                  <TableRow key={d.department} className="border-border/40">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ColorDot color={chartColorAt(i)} />
                        <span className="font-medium">{d.department}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">{d.employees}</TableCell>
                    <TableCell className="text-right text-sm">{d.assigned}</TableCell>
                    <TableCell className="text-right text-sm text-primary">{d.completed}</TableCell>
                    <TableCell>
                      <CompletionMeter rate={d.rate} />
                    </TableCell>
                    <TableCell className="text-right font-display font-semibold text-primary">
                      {d.points.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={cn("gap-1", TREND_BADGE)}>
                        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {up ? "+" : "-"}
                        {4 + i}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TablePanel>
    </>
  );
}
