import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { TaskForm, taskToValues } from "@/components/task-form";
import { useTaskQuery, useUpdateTask } from "@/features/tasks";

export const Route = createFileRoute("/admin/tasks/$id/edit")({
  head: () => ({ meta: [{ title: "Edit task — Poll" }] }),
  component: EditTaskPage,
});

function EditTaskPage() {
  const { id } = useParams({ from: "/admin/tasks/$id/edit" });
  const navigate = useNavigate();
  const { data: task, isLoading } = useTaskQuery(id);
  const updateTask = useUpdateTask({
    onSuccess: (updated) => {
      toast.success("Task updated", { description: `${updated.title} saved.` });
      navigate({ to: "/admin/tasks/$id", params: { id: updated.id || id } });
    },
    onError: (err) => {
      toast.error("Failed to update task", {
        description: err.message || "Please check the entered values and try again.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="glass flex flex-col items-center justify-center rounded-2xl py-20 text-muted-foreground">
        <p className="text-sm">Loading task...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Task not found"
        description="This task may have been deleted."
        action={<Button asChild><Link to="/admin/tasks">Back to tasks</Link></Button>}
      />
    );
  }

  return (
    <>
      <div>
        <Link to="/admin/tasks/$id" params={{ id: task.id }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to task
        </Link>
      </div>
      <PageHeader title={`Edit ${task.title}`} subtitle="Update details, assignee, or reward." />
      <TaskForm
        initial={taskToValues(task)}
        submitLabel="Save changes"
        isSubmitting={updateTask.isPending}
        apiError={updateTask.error?.message}
        onCancel={() => navigate({ to: "/admin/tasks/$id", params: { id: task.id } })}
        onSubmit={(v) => {
          const newFiles = v.attachments.map((a) => a.file).filter((f): f is File => f instanceof File);
          const retainedUrls = v.attachments.map((a) => a.url).filter((u): u is string => typeof u === "string" && u.length > 0);

          updateTask.mutate({
            id: task.id || id,
            input: {
              title: v.title,
              description: v.description,
              category: v.category,
              priority: v.priority,
              taskType: v.taskType,
              points: v.points,
              dueDate: v.dueDate,
              notes: v.notes || undefined,
              estimatedTime: v.estimatedTime || undefined,
              projectId: v.taskType === "project" ? v.projectId : undefined,
              assigneeId: v.taskType === "direct" ? v.assigneeId : undefined,
              existingAttachments: retainedUrls,
              attachments: newFiles,
            },
          });
        }}
      />
    </>
  );
}
