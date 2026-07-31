import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ListTodo, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { TaskCardGrid } from "@/components/task-card";
import { currentEmployee, type TaskPriority } from "@/lib/mock-data";
import { useAllTasks } from "@/lib/task-store";
import { applySubmissions, useSubmissionMap } from "@/lib/submission-store";
import { applyReviewDecisions, useReviewMap } from "@/lib/review-store";

export const Route = createFileRoute("/employee/tasks/")({
  head: () => ({
    meta: [
      { title: "Assigned Tasks — Poll" },
      { name: "description", content: "Everything currently on your plate." },
      { property: "og:title", content: "Assigned Tasks — Poll" },
      { property: "og:description", content: "Active work assigned to you." },
    ],
  }),
  component: AssignedTasksPage,
});

function AssignedTasksPage() {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<"all" | TaskPriority>("all");
  const subs = useSubmissionMap();
  const reviewMap = useReviewMap();
  const tasks = applyReviewDecisions(applySubmissions(useAllTasks(), subs), reviewMap);

  const mine = useMemo(() => {
    return tasks.filter((t) => {
      if (t.assigneeId !== currentEmployee.id) return false;
      if (t.status === "completed" || t.reviewState) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    });
  }, [tasks, query, priority]);

  return (
    <>
      <PageHeader title="Assigned tasks" subtitle="Active work assigned to you — submit for review when done." />

      <div className="glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks…" className="h-10 rounded-full pl-9" />
        </div>
        <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
          <SelectTrigger className="h-10 w-full rounded-full sm:w-40"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mine.length ? (
        <TaskCardGrid tasks={mine} bucket="assigned" />
      ) : (
        <EmptyState icon={ListTodo} title="Inbox zero" description="No active tasks — enjoy the calm." />
      )}
    </>
  );
}
