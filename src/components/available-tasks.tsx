import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  Eye,
  FolderKanban,
  Globe,
  Hand,
  Timer,
  Trophy,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PriorityBadge } from "@/components/status-badge";
import { IdBadge } from "@/components/id-badge";
import { TaskDetailDialog } from "@/components/task-detail-dialog";
import type { Task } from "@/lib/mock-data";
import { projectStats } from "@/lib/projects";
import { useProjectsQuery } from "@/features/projects";
import { useTasksQuery, useRequestTask } from "@/features/tasks";

function PoolCard({
  task,
  index = 0,
  showCreatedBy = true,
  onRequest,
  isRequesting,
}: {
  task: Task;
  index?: number;
  showCreatedBy?: boolean;
  onRequest?: (task: Task) => void;
  isRequesting?: boolean;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const alreadyRequested = Boolean(task.isRequestedByMe);

  return (
    <article
      className="rounded-md border border-border/60 bg-card/40 p-4 transition-all hover:border-primary/40 hover:bg-secondary/30 animate-in fade-in slide-in-from-bottom-1"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        <span className="rounded-sm bg-secondary/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {task.category}
        </span>
        {alreadyRequested && (
          <span className="rounded-sm bg-info/15 px-2 py-0.5 text-[10px] font-medium text-info">
            Requested
          </span>
        )}
      </div>
      <h4 className="mt-2 font-display text-sm font-semibold leading-snug">{task.title}</h4>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        <div>
          <dt className="flex items-center gap-1 text-muted-foreground"><Trophy className="h-3 w-3 text-warning" /> Reward</dt>
          <dd className="mt-0.5 font-medium">{task.points} pts</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-muted-foreground"><CalendarClock className="h-3 w-3" /> Deadline</dt>
          <dd className="mt-0.5 font-medium">
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
          </dd>
        </div>
        {task.estimatedTime && (
          <div>
            <dt className="flex items-center gap-1 text-muted-foreground"><Timer className="h-3 w-3" /> Estimate</dt>
            <dd className="mt-0.5 font-medium">{task.estimatedTime}</dd>
          </div>
        )}
        {showCreatedBy && task.createdBy && (
          <div className="col-span-2 sm:col-span-3">
            <dt className="flex items-center gap-1 text-muted-foreground"><UserRound className="h-3 w-3" /> Created by</dt>
            <dd className="mt-0.5 font-medium">{task.createdBy}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-md"
          onClick={() => setDetailOpen(true)}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" /> View details
        </Button>
        <Button
          size="sm"
          className="flex-1 rounded-md shadow-glow"
          disabled={alreadyRequested || isRequesting}
          onClick={() => onRequest?.(task)}
        >
          <Hand className="mr-1.5 h-3.5 w-3.5" />
          {alreadyRequested ? "Requested" : "Request task"}
        </Button>
      </div>

      <TaskDetailDialog task={task} open={detailOpen} onOpenChange={setDetailOpen} />
    </article>
  );
}

export function AvailableTasks() {
  const [openProject, setOpenProject] = useState<string | null>(null);
  const { data: allProjectList = [] } = useProjectsQuery();
  const { data: allTasks = [] } = useTasksQuery();
  const requestTask = useRequestTask({
    onSuccess: () => {
      toast.success("Task requested successfully", {
        description: "Your request has been submitted. Awaiting admin assignment.",
      });
    },
    onError: (err) => {
      toast.error("Failed to request task", {
        description: err.message || "An error occurred.",
      });
    },
  });

  const projects = allProjectList.filter((p) => (p.status || "").toLowerCase() === "active");

  const universal = allTasks.filter(
    (t) => (t.taskType === "universal" || (t.taskType as string) === "Universal") && (t.status === "available" || (t.status as string) === "Open") && !t.assigneeId,
  );
  const projectPool = allTasks.filter(
    (t) => (t.taskType === "project" || (t.taskType as string) === "Project") && (t.status === "available" || (t.status as string) === "Open") && !t.assigneeId,
  );

  const openProjectTasks = projectPool.filter((t) => t.projectId === openProject);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Available tasks</h2>
        <span className="text-xs text-muted-foreground">
          {universal.length + projectPool.length} open to claim
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Universal */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <h3 className="font-display text-lg font-semibold">🌐 Universal tasks</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Open to everyone — first to pick it owns it.</p>
          <div className="mt-4 space-y-3">
            {universal.length === 0 ? (
              <EmptyState icon={Globe} title="No universal tasks" description="New open tasks will appear here." />
            ) : (
              universal.map((t, i) => (
                <PoolCard
                  key={t.id}
                  task={t}
                  index={i}
                  onRequest={(t) => requestTask.mutate(t.id || t._id || "")}
                  isRequesting={requestTask.isPending}
                />
              ))
            )}
          </div>
        </div>

        {/* Projects */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-primary" />
              <h3 className="font-display text-lg font-semibold">📁 Project tasks</h3>
            </div>
            {openProject && (
              <Button variant="ghost" size="sm" className="rounded-md" onClick={() => setOpenProject(null)}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> All projects
              </Button>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {openProject ? "Pick one task from this project." : "Open a project to browse its available tasks."}
          </p>

          <div className="mt-4 space-y-3">
            {!openProject &&
              projects.map((p) => {
                const targetId = p._id || p.id;
                const stats = projectStats(allTasks, targetId);
                const count = projectPool.filter((t) => t.projectId === targetId || t.projectId === p.id).length;
                return (
                  <button
                    key={targetId}
                    type="button"
                    onClick={() => setOpenProject(targetId)}
                    className="flex w-full items-center gap-3 rounded-md border border-border/60 bg-card/40 p-4 text-left transition-all hover:border-primary/40 hover:bg-secondary/30"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
                      <FolderKanban className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold">{p.name}</span>
                        <IdBadge id={p.code} />
                        <span className="rounded-sm bg-success/15 px-1.5 py-0.5 text-[10px] font-medium text-success">
                          Active
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{p.description}</span>
                      <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span>{count} available</span>
                        <span>{stats.completed} completed</span>
                        <span>{stats.pending} pending</span>
                      </span>
                    </span>
                    <span className="shrink-0 rounded-sm bg-secondary/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {count} open
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}

            {openProject &&
              (openProjectTasks.length === 0 ? (
                <EmptyState icon={FolderKanban} title="No open tasks" description="Every task in this project is taken." />
              ) : (
                openProjectTasks.map((t, i) => (
                  <PoolCard
                    key={t.id}
                    task={t}
                    index={i}
                    showCreatedBy={false}
                    onRequest={(t) => requestTask.mutate(t.id || t._id || "")}
                    isRequesting={requestTask.isPending}
                  />
                ))
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
