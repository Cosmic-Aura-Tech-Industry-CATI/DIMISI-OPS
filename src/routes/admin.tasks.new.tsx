import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { TaskForm, emptyTaskValues } from "@/components/task-form";
import { employees } from "@/lib/mock-data";
import { projectName } from "@/lib/projects";
import { createTask } from "@/lib/task-store";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/tasks/new")({
  head: () => ({ meta: [{ title: "New task — Poll" }] }),
  component: NewTaskPage,
});

function NewTaskPage() {
  const navigate = useNavigate();
  const auth = useAuth();
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
        onCancel={() => navigate({ to: "/admin/tasks" })}
        onSubmit={(v) => {
          const assignee = employees.find((e) => e.id === v.assigneeId);
          createTask({
            title: v.title,
            description: v.description,
            category: v.category,
            priority: v.priority,
            points: v.points,
            dueDate: v.dueDate,
            notes: v.notes || undefined,
            attachments: v.attachments,
            taskType: v.taskType,
            projectId: v.projectId || undefined,
            estimatedTime: v.estimatedTime || undefined,
            assigneeId: v.assigneeId,
            assigneeName: assignee?.name,
            createdBy: auth.user?.name ?? "Admin",
          });
          const where =
            v.taskType === "direct"
              ? `Assigned to ${assignee?.name ?? "employee"}.`
              : v.taskType === "project"
                ? `Published to ${projectName(v.projectId)} — employees can pick it up.`
                : "Published to Universal Tasks — employees can pick it up.";
          toast.success("Task created", { description: `${v.title} · ${where}` });
          navigate({ to: "/admin/tasks" });
        }}
      />
    </>
  );
}

