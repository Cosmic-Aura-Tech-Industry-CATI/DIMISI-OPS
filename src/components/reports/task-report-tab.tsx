import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { tasks } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { TablePanel } from "./report-panels";
import type { TaskBucket } from "./use-report-data";

const PRIORITY_BADGE = "border-primary/30 bg-primary/10 text-primary";

export function TaskReportTab({
  buckets,
  onDownload,
}: {
  buckets: TaskBucket[];
  onDownload: () => void;
}) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-4">
        {buckets.map((t) => (
          <div key={t.key} className="glass rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.label}</div>
            <div className={cn("mt-1 font-display text-3xl font-semibold", t.tone)}>{t.value}</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                style={{ width: `${Math.min(100, (t.value / tasks.length) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <TablePanel
        title="All tasks"
        subtitle="Status, priority, and reward across the workspace"
        onDownload={onDownload}
      >
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
                  <Badge variant="outline" className={cn("capitalize border", PRIORITY_BADGE)}>
                    {t.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.status} />
                </TableCell>
                <TableCell className="text-right font-medium">+{t.points}</TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {new Date(t.dueDate).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TablePanel>
    </>
  );
}
