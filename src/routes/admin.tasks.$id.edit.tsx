import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { TaskForm, taskToValues, type TaskFormValues } from "@/components/task-form";
import { useTaskQuery, useUpdateTask, type UpdateTaskInput } from "@/features/tasks";

export const Route = createFileRoute("/admin/tasks/$id/edit")({
  head: () => ({ meta: [{ title: "Edit task — DIMISI OPS" }] }),
  component: EditTaskPage,
});

function EditTaskPage() {
  const { id } = useParams({ from: "/admin/tasks/$id/edit" });
  const navigate = useNavigate();
  const { data: task, isLoading, isError, error } = useTaskQuery(id);
  const updateTask = useUpdateTask({
    onSuccess: (updated) => {
      toast.success("Task updated", { description: `${updated.title} saved successfully.` });
      navigate({ to: "/admin/tasks/$id", params: { id: updated.id || (updated as any)._id || id } });
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
        <p className="text-sm">Loading task data…</p>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Task not found"
        description={error?.message || "This task may have been deleted or is not accessible."}
        action={<Button asChild><Link to="/admin/tasks">Back to tasks</Link></Button>}
      />
    );
  }

  const initialValues = taskToValues(task);

  const handleSubmit = (v: TaskFormValues) => {
    // Only send fields that were explicitly modified to strictly protect live production data
    const input: UpdateTaskInput = {};
    let hasChanges = false;

    if (v.title.trim() !== initialValues.title.trim()) {
      input.title = v.title.trim();
      hasChanges = true;
    }
    if (v.description.trim() !== initialValues.description.trim()) {
      input.description = v.description.trim();
      hasChanges = true;
    }
    if (v.category !== initialValues.category) {
      input.category = v.category;
      hasChanges = true;
    }
    if (v.priority !== initialValues.priority) {
      input.priority = v.priority;
      hasChanges = true;
    }
    if (v.taskType !== initialValues.taskType) {
      input.taskType = v.taskType;
      hasChanges = true;
    }
    if (v.points !== initialValues.points) {
      input.points = v.points;
      hasChanges = true;
    }
    if (v.dueDate !== initialValues.dueDate) {
      input.dueDate = v.dueDate;
      hasChanges = true;
    }
    if (v.notes.trim() !== initialValues.notes.trim()) {
      input.notes = v.notes.trim();
      hasChanges = true;
    }
    if (v.estimatedTime.trim() !== initialValues.estimatedTime.trim()) {
      input.estimatedTime = v.estimatedTime.trim();
      hasChanges = true;
    }
    if (v.taskType === "project" && v.projectId !== initialValues.projectId) {
      input.projectId = v.projectId;
      hasChanges = true;
    }
    if (v.taskType === "direct" && v.assigneeId !== initialValues.assigneeId) {
      input.assigneeId = v.assigneeId;
      hasChanges = true;
    }

    // Attachments tracking
    const uploadedAttachments = v.attachments
      .filter((a) => a.url && a.publicId)
      .map((a) => ({
        url: a.url!,
        publicId: a.publicId!,
        name: a.name,
        size: a.size,
      }));

    const retainedUrls = v.attachments
      .map((a) => a.url)
      .filter((u): u is string => typeof u === "string" && u.length > 0);

    const initialUrls = (task.attachments || []).map((a) => a.url).filter(Boolean);
    const attachmentsChanged =
      retainedUrls.length !== initialUrls.length ||
      retainedUrls.some((u, idx) => u !== initialUrls[idx]) ||
      uploadedAttachments.length > 0;

    if (attachmentsChanged) {
      input.existingAttachments = retainedUrls;
      input.uploadedAttachments = uploadedAttachments;
      hasChanges = true;
    }

    if (!hasChanges) {
      toast.info("No changes were made to the task.");
      navigate({ to: "/admin/tasks/$id", params: { id: task.id || (task as any)._id || id } });
      return;
    }

    updateTask.mutate({
      id: task.id || (task as any)._id || id,
      input,
    });
  };

  return (
    <>
      <div>
        <Link
          to="/admin/tasks/$id"
          params={{ id: task.id || (task as any)._id || id }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to task
        </Link>
      </div>
      <PageHeader
        title={`Edit ${task.title}`}
        subtitle="Update details, priority, deadline, reward points, or assignment."
      />
      <TaskForm
        initial={initialValues}
        submitLabel="Update Task"
        isSubmitting={updateTask.isPending}
        apiError={updateTask.error?.message}
        onCancel={() => navigate({ to: "/admin/tasks/$id", params: { id: task.id || (task as any)._id || id } })}
        onSubmit={handleSubmit}
      />
    </>
  );
}
