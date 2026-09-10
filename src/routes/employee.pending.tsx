import { createFileRoute } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TaskTable } from "@/components/task-table";
import { EmptyState } from "@/components/empty-state";
import { useTasksQuery } from "@/features/tasks";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/employee/pending")({
  head: () => ({
    meta: [
      { title: "Pending Tasks — Poll" },
      { name: "description", content: "Focus on what's still open." },
      { property: "og:title", content: "Pending Tasks — Poll" },
      { property: "og:description", content: "Focus on what's still open." },
    ],
  }),
  component: PendingTasksPage,
});

function PendingTasksPage() {
  const auth = useAuth();
  const { data: tasks = [] } = useTasksQuery();
  const currentUserId = auth.user?.id || auth.user?._id || "";

  const open = tasks.filter((t) => {
    const isMine =
      (currentUserId && t.assigneeId === currentUserId) ||
      (auth.user?.name && t.assignee === auth.user.name) ||
      (auth.user?.email && t.assignee === auth.user.email);
    return (
      isMine &&
      (t.status === "pending" ||
        t.status === "in_progress" ||
        t.status === "assigned" ||
        t.status === "overdue" ||
        (t.status as string) === "In Progress" ||
        (t.status as string) === "Assigned")
    );
  });

  return (
    <>
      <PageHeader title="Pending Tasks" subtitle="Your active workload." />
      {open.length ? (
        <TaskTable tasks={open} showAssignee={false} />
      ) : (
        <EmptyState icon={Clock} title="Nothing pending" description="You're all caught up. Great pace." />
      )}
    </>
  );
}
