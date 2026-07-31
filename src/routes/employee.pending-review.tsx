import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TaskCardGrid } from "@/components/task-card";
import { currentEmployee } from "@/lib/mock-data";
import { useAllTasks } from "@/lib/task-store";
import { applySubmissions, useSubmissionMap } from "@/lib/submission-store";
import { applyReviewDecisions, useReviewMap } from "@/lib/review-store";

export const Route = createFileRoute("/employee/pending-review")({
  head: () => ({
    meta: [
      { title: "Pending Review — Poll" },
      { name: "description", content: "Submissions awaiting admin review." },
      { property: "og:title", content: "Pending Review — Poll" },
      { property: "og:description", content: "Tasks awaiting review." },
    ],
  }),
  component: PendingReviewPage,
});

function PendingReviewPage() {
  const reviewMap = useReviewMap();
  const subs = useSubmissionMap();
  const list = applyReviewDecisions(applySubmissions(useAllTasks(), subs), reviewMap).filter((t) => t.assigneeId === currentEmployee.id && t.reviewState === "in_review");
  return (
    <>
      <PageHeader title="Pending review" subtitle="Waiting on admin approval — hang tight." />
      {list.length ? (
        <TaskCardGrid tasks={list} bucket="review" />
      ) : (
        <EmptyState icon={ClipboardCheck} title="Nothing in review" description="Submitted tasks will appear here until an admin approves them." />
      )}
    </>
  );
}
