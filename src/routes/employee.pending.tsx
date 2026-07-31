import { createFileRoute } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TaskTable } from "@/components/task-table";
import { EmptyState } from "@/components/empty-state";
import { tasks, currentEmployee } from "@/lib/mock-data";

export const Route = createFileRoute("/employee/pending")({
  head: () => ({
    meta: [
      { title: "Pending Tasks — Poll" },
      { name: "description", content: "Focus on what's still open." },
      { property: "og:title", content: "Pending Tasks — Poll" },
      { property: "og:description", content: "Focus on what's still open." },
    ],
  }),
  component: () => {
    const open = tasks.filter(
      (t) => t.assigneeId === currentEmployee.id && (t.status === "pending" || t.status === "in_progress" || t.status === "overdue"),
    );
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
  },
});
