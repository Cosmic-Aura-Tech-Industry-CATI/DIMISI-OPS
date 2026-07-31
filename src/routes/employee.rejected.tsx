import { createFileRoute } from "@tanstack/react-router";
import { XCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TaskCardGrid } from "@/components/task-card";
import { currentEmployee } from "@/lib/mock-data";
import { useAllTasks } from "@/lib/task-store";
import { applySubmissions, useSubmissionMap } from "@/lib/submission-store";
import { applyReviewDecisions, useReviewMap } from "@/lib/review-store";

export const Route = createFileRoute("/employee/rejected")({
  head: () => ({
    meta: [
      { title: "Rejected Tasks — Poll" },
      { name: "description", content: "Tasks sent back for changes — review notes and resubmit." },
      { property: "og:title", content: "Rejected Tasks — Poll" },
      { property: "og:description", content: "Tasks sent back for changes." },
    ],
  }),
  component: RejectedTasksPage,
});

function RejectedTasksPage() {
  const reviewMap = useReviewMap();
  const subs = useSubmissionMap();
  const list = applyReviewDecisions(applySubmissions(useAllTasks(), subs), reviewMap).filter((t) => t.assigneeId === currentEmployee.id && t.reviewState === "rejected");
  return (
    <>
      <PageHeader title="Rejected tasks" subtitle="Address the feedback and resubmit when ready." />
      {list.length ? (
        <TaskCardGrid tasks={list} bucket="rejected" />
      ) : (
        <EmptyState icon={XCircle} title="Nothing rejected" description="Rejected submissions with reviewer notes will appear here." />
      )}
    </>
  );
}
