import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TaskCardGrid } from "@/components/task-card";
import { currentEmployee } from "@/lib/mock-data";
import { useAllTasks } from "@/lib/task-store";
import { applySubmissions, useSubmissionMap } from "@/lib/submission-store";
import { applyReviewDecisions, useReviewMap } from "@/lib/review-store";

export const Route = createFileRoute("/employee/completed")({
  head: () => ({
    meta: [
      { title: "Completed Tasks — Poll" },
      { name: "description", content: "A record of every task you've closed out." },
      { property: "og:title", content: "Completed Tasks — Poll" },
      { property: "og:description", content: "Tasks you've completed." },
    ],
  }),
  component: CompletedTasksPage,
});

function CompletedTasksPage() {
  const subs = useSubmissionMap();
  const reviewMap = useReviewMap();
  const tasks = applyReviewDecisions(applySubmissions(useAllTasks(), subs), reviewMap);
  const done = tasks.filter(
    (t) => t.assigneeId === currentEmployee.id && t.status === "completed" && t.reviewState !== "in_review" && t.reviewState !== "rejected",
  );
  const points = done.reduce((s, t) => s + t.points, 0);

  return (
    <>
      <PageHeader
        title="Completed tasks"
        subtitle={`${done.length} approved · ${points} points earned.`}
      />
      {done.length ? (
        <TaskCardGrid tasks={done} bucket="completed" />
      ) : (
        <EmptyState icon={CheckCircle2} title="No completed tasks yet" description="Wrap up something on your list to see it appear here." />
      )}
    </>
  );
}
