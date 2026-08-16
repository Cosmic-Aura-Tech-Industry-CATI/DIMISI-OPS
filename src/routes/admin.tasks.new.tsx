import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { TaskForm, emptyTaskValues } from "@/components/task-form";
import { useCreateTask } from "@/features/tasks";
import { projectName } from "@/lib/projects";

export const Route = createFileRoute("/admin/tasks/new")({
  head: () => ({ meta: [{ title: "New task — Poll" }] }),
  component: NewTaskPage,
  });

function NewTaskPage() {
  const navigate = useNavigate();
  const createTask = useCreateTask({
    onSuccess: (task, variables) => {
      const isDirect = typeof variables === "object" && !(variables instanceof FormData) && variables.taskType === "direct";
      const isProject = typeof variables === "object" && !(variables instanceof FormData) && variables.taskType === "project";
      const where = isDirect
        ? `Assigned to ${task.assignee || "employee"}.`
        : isProject
          ? `Published to ${task.projectName || projectName(task.projectId)} — employees can pick it up.`
          : "Published to Universal Tasks — employees can pick it up.";
      toast.success("Task created", { description: `${task.title} · ${where}` });
      navigate({ to: "/admin/tasks" });
    },
    onError: (err) => {
      toast.error("Failed to create task", {
        description: err.message || "Please check the entered values and try again.",
      });
    },
  });

  return (
    <>
      <div>
        <Link to="/admin/tasks" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to tasks
        </Link>
      </div>
      <PageHeader title="Create task" subtitle="Pick a category, set a reward, and ship it." />
      <TaskForm
        initial={emptyTaskValues()}
        submitLabel="Create task"
        isSubmitting={createTask.isPending}
        apiError={createTask.error?.message}
        onCancel={() => navigate({ to: "/admin/tasks" })}
        onSubmit={(v) => {
          const files = v.attachments.map((a) => a.file).filter((f): f is File => f instanceof File);
          createTask.mutate({
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
            attachments: files,
          });
        }}
      />
    </>
  );
}

