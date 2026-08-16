import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  FileQuestion,
  FileText,
  Paperclip,
  Pencil,
  StickyNote,
  Trash2,
  Trophy,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
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
import { useTaskQuery, useDeleteTask } from "@/features/tasks";

export const Route = createFileRoute("/admin/tasks/$id")({
  head: () => ({ meta: [{ title: "Task details — Poll" }] }),
  component: TaskDetailPage,
});

const taskId = (id: string) => `TSK-${id.replace(/\D/g, "").padStart(4, "0") || id.slice(-4)}`;

function TaskDetailPage() {
  const { id } = useParams({ from: "/admin/tasks/$id" });
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
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

  if (isLoading) {
    return (
      <div className="glass flex flex-col items-center justify-center rounded-2xl py-20 text-muted-foreground">
        <p className="text-sm">Loading task details...</p>
      </div>
    );
  }

  if (!task) {
    return <EmptyState icon={FileQuestion} title="Task not found" description="This task may have been deleted."
      action={<Button asChild><Link to="/admin/tasks">Back to tasks</Link></Button>} />;
  }

  const assignee = employees.find((e) => e.id === task.assigneeId) || (task.assignee ? { name: task.assignee, avatar: task.assignee.slice(0, 2).toUpperCase() } : undefined);
  const creator = task.createdBy || "Admin";
  const daysLeft = task.dueDate ? Math.ceil((+new Date(task.dueDate) - Date.now()) / 86400000) : 0;

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
                    <span className="flex items-center gap-2"><Paperclip className="h-3.5 w-3.5" /> {a.name}</span>
                    <span className="text-xs text-muted-foreground">{a.size}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No attachments.</p>
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
