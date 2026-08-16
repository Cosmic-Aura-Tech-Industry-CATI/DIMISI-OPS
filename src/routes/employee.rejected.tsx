import { createFileRoute } from "@tanstack/react-router";
import { XCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TaskCardGrid } from "@/components/task-card";
import { currentEmployee } from "@/lib/mock-data";
import { useTasksQuery } from "@/features/tasks";
import { useAuth } from "@/lib/auth";
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
    return isMine && (t.reviewState === "rejected" || t.rejectionReason);
  });

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
