import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TaskCardGrid } from "@/components/task-card";
import { currentEmployee } from "@/lib/mock-data";
import { useTasksQuery } from "@/features/tasks";
import { useAuth } from "@/lib/auth";
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
  const auth = useAuth();
  const reviewMap = useReviewMap();
  const subs = useSubmissionMap();
  const { data: rawTasks = [] } = useTasksQuery();
  const currentUserId = auth.user?.id || auth.user?._id || currentEmployee.id;

  const list = applyReviewDecisions(applySubmissions(rawTasks, subs), reviewMap).filter((t) => {
    const isMine =
      t.assigneeId === currentUserId ||
      (auth.user?.name && t.assignee === auth.user.name) ||
      (auth.user?.email && t.assignee === auth.user.email);
    return isMine && (t.reviewState === "in_review" || (t.status as string) === "In Review");
  });

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
