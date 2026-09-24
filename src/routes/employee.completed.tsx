import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Search, Calendar, Trophy } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/skeletons";
import { TaskStatusBadge, TaskPriorityBadge } from "@/components/task-status-badge";
import { useCompletedTasks } from "@/features/tasks";

export const Route = createFileRoute("/employee/completed")({
  head: () => ({
    meta: [
      { title: "Completed Tasks — Poll" },
      { name: "description", content: "A record of every task you've closed out." },
      { property: "og:title", content: "Completed Tasks — Poll" },
      { property: "og:description", content: "Tasks you've completed." },
    ],
  }),
  component: CompletedTasksPage,
});

function CompletedTasksPage() {
  const [query, setQuery] = useState("");
  const { data: tasks = [], isLoading, isError, error, refetch } = useCompletedTasks();

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q))
      );
    });
  }, [tasks, query]);

  const totalPoints = useMemo(() => {
    return tasks.reduce((sum, t) => sum + (t.points || t.rewardPoints || 0), 0);
  }, [tasks]);

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Completed Tasks"
          subtitle="Your verified achievements and awarded reward points."
        />
        <div className="space-y-4">
          <div className="h-12 w-full rounded-2xl bg-card/40 animate-pulse" />
          <TableSkeleton rows={5} cols={5} />
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <PageHeader
          title="Completed Tasks"
          subtitle="Your verified achievements and awarded reward points."
        />
        <ErrorState
          title="Could not load completed tasks"
          description={error?.message || "There was a problem communicating with the server."}
          onRetry={() => refetch()}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Completed Tasks"
        subtitle={`${tasks.length} tasks approved · ${totalPoints} points earned.`}
      />

      {/* Search toolbar */}
      <div className="glass flex items-center gap-3 rounded-2xl p-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search completed tasks…"
            className="h-10 rounded-full pl-9"
          />
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No Completed Tasks"
          description="Tasks you have finished and had approved will appear here."
        />
      ) : (
        <div className="glass overflow-hidden rounded-2xl border border-border/60">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-muted/20 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Task</th>
                  <th className="px-5 py-3.5 font-semibold">Priority</th>
                  <th className="px-5 py-3.5 font-semibold">Completed / Due Date</th>
                  <th className="px-5 py-3.5 font-semibold">Reward Points</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredTasks.map((task, idx) => {
                  const taskId = task._id || task.id;
                  return (
                    <tr
                      key={taskId || idx}
                      className="transition-colors hover:bg-muted/30 animate-in fade-in"
                    >
                      {/* Task Name & Description */}
                      <td className="px-5 py-4 max-w-sm">
                        <Link
                          to="/employee/tasks/$id"
                          params={{ id: taskId }}
                          className="font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors cursor-pointer"
                        >
                          {task.title}
                        </Link>
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {task.description || "Completed task."}
                        </div>
                        {task.category && (
                          <span className="mt-1 inline-block rounded-md bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                            {task.category}
                          </span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <TaskPriorityBadge priority={task.priority} />
                      </td>

                      {/* Completed / Due Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                        <div className="inline-flex items-center gap-1.5 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span>
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString()
                              : task.createdAt
                                ? new Date(task.createdAt).toLocaleDateString()
                                : "Completed"}
                          </span>
                        </div>
                      </td>

                      {/* Reward Points */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-400">
                          <Trophy className="h-3.5 w-3.5 text-warning" /> +
                          {task.points || task.rewardPoints || 0} pts
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <TaskStatusBadge status="COMPLETED" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
