import { Sparkles } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompletionMeter, TablePanel } from "./report-panels";
import type { EmployeeReportRow } from "./use-report-data";

export function EmployeeReportTab({
  rows,
  onDownload,
}: {
  rows: EmployeeReportRow[];
  onDownload: () => void;
}) {
  return (
    <TablePanel
      title="Employee performance"
      subtitle="Ranked by points earned"
      onDownload={onDownload}
    >
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
          {rows.map((e) => (
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
                <CompletionMeter rate={e.rate} />
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
    </TablePanel>
  );
}
