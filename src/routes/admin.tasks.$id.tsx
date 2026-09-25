import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  FileQuestion,
  FileText,
  Loader2,
  Paperclip,
  Pencil,
  StickyNote,
  Trash2,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { admins, employees } from "@/lib/mock-data";
import { useTaskQuery, useDeleteTask, useAssignTask, type Task } from "@/features/tasks";

export const Route = createFileRoute("/admin/tasks/$id")({
  head: () => ({ meta: [{ title: "Task details — Poll" }] }),
  component: TaskDetailPage,
});

const taskId = (id: string) => id;

function formatRequestedAt(dateStr?: string) {
  if (!dateStr) return "Recently";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

const DUMMY_REQUESTS: NonNullable<Task["requests"]> = [
  {
    _id: "req_dummy_1",
    employeeId: {
      _id: "emp_dummy_1",
      name: "Mridul Mishra",
      email: "2022bds017@axiscolleges.in",
    },
    employeeName: "Mridul Mishra",
    employeeEmail: "2022bds017@axiscolleges.in",
    requestedAt: "2026-09-25T07:36:33.937Z",
  },
  {
    _id: "req_dummy_2",
    employeeId: {
      _id: "emp_dummy_2",
      name: "Priya Nair",
      email: "priya@poll.io",
    },
    employeeName: "Priya Nair",
    employeeEmail: "priya@poll.io",
    requestedAt: "2026-09-25T08:15:20.100Z",
  },
];

function TaskDetailPage() {
  const { id } = useParams({ from: "/admin/tasks/$id" });
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [processing, setProcessing] = useState<{ id: string; action: "accept" | "reject" } | null>(
    null,
  );

  const { data: task, isLoading } = useTaskQuery(id);
  const deleteTask = useDeleteTask({
    onSuccess: () => {
      toast.success("Task deleted");
      navigate({ to: "/admin/tasks" });
    },
    onError: (err) => {
      toast.error("Failed to delete task", {
        description: err.message || "An error occurred while deleting the task.",
      });
    },
  });

  const assignTaskMutation = useAssignTask();

  if (isLoading) {
    return (
      <div className="glass flex flex-col items-center justify-center rounded-2xl py-20 text-muted-foreground">
        <p className="text-sm">Loading task details...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Task not found"
        description="This task may have been deleted."
        action={
          <Button asChild>
            <Link to="/admin/tasks">Back to tasks</Link>
          </Button>
        }
      />
    );
  }

  const assignee =
    employees.find((e) => e.id === task.assigneeId) ||
    (task.assignee ? { name: task.assignee, avatar: task.assignee.slice(0, 2).toUpperCase() } : undefined);
  const creator = task.createdBy || "Admin";
  const daysLeft = task.dueDate ? Math.ceil((+new Date(task.dueDate) - Date.now()) / 86400000) : 0;

  // Resolve employee requests directly from task.requests API payload or dummy demo requests
  const rawRequests =
    Array.isArray(task.requests) && task.requests.length > 0
      ? task.requests
      : DUMMY_REQUESTS;

  const pendingRequests = rawRequests
    .filter((r) => {
      const empObj = typeof r.employeeId === "object" && r.employeeId !== null ? r.employeeId : null;
      const empId = empObj?._id || (typeof r.employeeId === "string" ? r.employeeId : "") || r._id || "";
      return !rejectedIds.includes(empId) && !rejectedIds.includes(r._id || "");
    })
    .map((req) => {
      const empObj = typeof req.employeeId === "object" && req.employeeId !== null ? req.employeeId : null;
      const name = empObj?.name || req.employeeName || "Employee";
      const email = empObj?.email || req.employeeEmail || "—";
      const employeeId = empObj?._id || (typeof req.employeeId === "string" ? req.employeeId : "") || req._id || "";
      const avatar = name
        ? name
            .split(" ")
            .map((part: string) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "EM";

      return {
        _id: req._id,
        employeeId,
        name,
        email,
        avatar,
        requestedAt: req.requestedAt,
      };
    });

  const handleAccept = async (req: (typeof pendingRequests)[number]) => {
    const targetId = req.employeeId || req._id;
    if (!targetId) return;
    setProcessing({ id: targetId, action: "accept" });
    try {
      if (targetId.startsWith("emp_dummy_") || req._id?.startsWith("req_dummy_")) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        setRejectedIds((prev) => [...prev, targetId, req._id || "", req.employeeId || ""].filter(Boolean));
        toast.success(`Request accepted! Task assigned to ${req.name}.`);
      } else {
        await assignTaskMutation.mutateAsync({
          id: task.id || task._id,
          employeeId: req.employeeId,
        });
        toast.success(`Request accepted! Task assigned to ${req.name}.`);
      }
    } catch (err: any) {
      toast.error("Failed to accept request", {
        description: err?.message || "An error occurred while assigning the task.",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = (req: (typeof pendingRequests)[number]) => {
    const targetId = req.employeeId || req._id;
    if (!targetId) return;
    setProcessing({ id: targetId, action: "reject" });
    setTimeout(() => {
      setRejectedIds((prev) => [...prev, targetId, req._id || "", req.employeeId || ""].filter(Boolean));
      setProcessing(null);
      toast.info(`Request from ${req.name} rejected.`);
    }, 250);
  };

  return (
    <>
      <div>
        <Link to="/admin/tasks" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to tasks
        </Link>
      </div>

      <PageHeader
        title={task.title}
        subtitle={`${task.category} · ${taskId(task.id)}`}
        actions={
          <>
            <Button asChild variant="outline" className="rounded-md">
              <Link to="/admin/tasks/$id/edit" params={{ id: task.id }}><Pencil className="mr-1.5 h-4 w-4" /> Edit</Link>
            </Button>
            <Button variant="destructive" className="rounded-md" onClick={() => setConfirm(true)}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="glass rounded-2xl p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              <span className="inline-flex items-center gap-1 rounded-sm bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">
                <Trophy className="h-3 w-3" /> {task.points} pts
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-display font-semibold">Description</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{task.description}</p>

            {task.notes && (
              <>
                <div className="mt-6 flex items-center gap-2 text-sm">
                  <StickyNote className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-display font-semibold">Notes</h3>
                </div>
                <p className="mt-2 rounded-xl border border-border/60 bg-card/40 p-3 text-sm text-muted-foreground">{task.notes}</p>
              </>
            )}
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-display font-semibold">Attachments</h3>
            </div>
            {task.attachments && task.attachments.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {task.attachments.map((a, i) => (
                  <li key={i} className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-sm">
                    {a.url ? (
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-medium text-primary hover:underline">
                        <Paperclip className="h-3.5 w-3.5" /> {a.name}
                      </a>
                    ) : (
                      <span className="flex items-center gap-2"><Paperclip className="h-3.5 w-3.5" /> {a.name}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{a.size}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No attachments.</p>
            )}
          </div>

          {/* Employee Requests */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-display font-semibold">Employee Requests</h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Employees who requested to work on this task
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-border/60 bg-secondary/50 font-medium text-xs text-muted-foreground"
              >
                {pendingRequests.length} pending
              </Badge>
            </div>

            {pendingRequests.length > 0 ? (
              <div className="mt-4 overflow-x-auto rounded-xl border border-border/60 bg-card/40">
                <table className="w-full whitespace-nowrap text-left text-sm">
                  <thead className="border-b border-border/60 bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Employee</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Requested</th>
                      <th className="px-4 py-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {pendingRequests.map((req) => {
                      const isAccepting =
                        processing?.id === req.employeeId && processing?.action === "accept";
                      const isRejecting =
                        processing?.id === req.employeeId && processing?.action === "reject";
                      const isBusy = Boolean(processing?.id === req.employeeId);

                      return (
                        <tr
                          key={req._id || req.employeeId}
                          className="transition-colors hover:bg-muted/30"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
                                {req.avatar}
                              </span>
                              <span className="font-medium text-foreground">{req.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {req.email}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {formatRequestedAt(req.requestedAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                disabled={isBusy || assignTaskMutation.isPending}
                                className="h-8 gap-1.5 bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-500 shadow-sm transition-colors"
                                onClick={() => handleAccept(req)}
                              >
                                {isAccepting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isBusy || assignTaskMutation.isPending}
                                className="h-8 gap-1.5 border-destructive/40 px-3 text-xs font-medium text-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-colors"
                                onClick={() => handleReject(req)}
                              >
                                {isRejecting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <X className="h-3.5 w-3.5" />
                                )}
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No employee requests yet.
              </p>
            )}
          </div>
        </div>

        <div className="glass h-fit rounded-2xl p-6">
          <h3 className="font-display font-semibold">Details</h3>
          <dl className="mt-4 space-y-4 text-sm">
            <Row icon={User} label="Assignee">
              {assignee ? (
                <span className="inline-flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">{assignee.avatar}</span>
                  {assignee.name}
                </span>
              ) : "Unassigned"}
            </Row>
            <Row icon={CalendarDays} label="Deadline">
              <div className="text-right">
                <div>{new Date(task.dueDate).toLocaleDateString(undefined, { dateStyle: "medium" })}</div>
                <div className={`text-xs ${daysLeft < 0 ? "text-destructive" : daysLeft <= 3 ? "text-warning" : "text-muted-foreground"}`}>
                  {daysLeft < 0 ? `${-daysLeft}d overdue` : daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
                </div>
              </div>
            </Row>
            <Row icon={Trophy} label="Reward"><span className="font-medium">{task.points} pts</span></Row>
            <Row icon={FileText} label="Category">{task.category}</Row>
            <Row icon={User} label="Created by">{creator}</Row>
            <Row icon={CalendarDays} label="Created">{new Date(task.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</Row>
          </dl>
        </div>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{task.title}"?</AlertDialogTitle>
            <AlertDialogDescription>This task and its history will be removed. This action can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTask.isPending}
              onClick={() => {
                deleteTask.mutate(task.id || task._id);
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Row({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</dt>
      <dd className="text-right text-sm">{children}</dd>
    </div>
  );
}
