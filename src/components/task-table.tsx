import { CalendarDays, Trophy } from "lucide-react";
import type { Task } from "@/lib/mock-data";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ListTodo } from "lucide-react";

export function TaskTable({ tasks, showAssignee = true }: { tasks: Task[]; showAssignee?: boolean }) {
  if (!tasks.length) {
    return <EmptyState icon={ListTodo} title="No tasks here" description="You're all caught up. New tasks will appear here." />;
  }
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="px-5 py-3 font-medium">Task</th>
              {showAssignee && <th className="px-5 py-3 font-medium">Assignee</th>}
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Priority</th>
              <th className="px-5 py-3 font-medium">Due</th>
              <th className="px-5 py-3 font-medium">Points</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => (
              <tr
                key={t.id}
                className="border-b border-border/40 transition-colors hover:bg-muted/40 animate-in fade-in slide-in-from-bottom-1"
                style={{ animationDelay: `${i * 25}ms` }}
              >
                <td className="px-5 py-3.5">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.category}</div>
                </td>
                {showAssignee && (
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent/50 text-[11px] font-semibold">
                        {t.assignee
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <span>{t.assignee}</span>
                    </div>
                  </td>
                )}
                <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                <td className="px-5 py-3.5"><PriorityBadge priority={t.priority} /></td>
                <td className="px-5 py-3.5">
                  <div className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Trophy className="h-3.5 w-3.5 text-warning" /> {t.points}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
