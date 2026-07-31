import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { TaskForm, taskToValues } from "@/components/task-form";
import { tasks } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/tasks/$id/edit")({
  head: () => ({ meta: [{ title: "Edit task — Poll" }] }),
  component: EditTaskPage,
});

function EditTaskPage() {
  const { id } = useParams({ from: "/admin/tasks/$id/edit" });
  const navigate = useNavigate();
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return <EmptyState icon={FileQuestion} title="Task not found" description="This task may have been deleted."
      action={<Button asChild><Link to="/admin/tasks">Back to tasks</Link></Button>} />;
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
        onCancel={() => navigate({ to: "/admin/tasks/$id", params: { id: task.id } })}
        onSubmit={(v) => {
          toast.success("Task updated", { description: `${v.title} saved.` });
          navigate({ to: "/admin/tasks/$id", params: { id: task.id } });
        }}
      />
    </>
  );
}
