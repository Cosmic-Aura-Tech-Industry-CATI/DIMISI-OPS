import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TaskCardGrid } from "@/components/task-card";
import { useTasksQuery, usePendingTasksQuery, type Task } from "@/features/tasks";
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
  const { data: pendingBucket = [] } = usePendingTasksQuery();

  const currentUserId = auth.user?.id || auth.user?._id || "";

  const taskMap = new Map<string, Task>();
  for (const t of rawTasks) {
    taskMap.set(t.id || t._id, t);
  }
  for (const t of pendingBucket) {
    taskMap.set(t.id || t._id, t);
  }

  const mergedTasks = Array.from(taskMap.values());

  const list = applyReviewDecisions(applySubmissions(mergedTasks, subs), reviewMap).filter((t) => {
    const isMine =
      t.assigneeId === currentUserId ||
      (auth.user?.name && t.assignee === auth.user.name) ||
      (auth.user?.email && t.assignee === auth.user.email);
    return (
      (isMine || !t.assigneeId) &&
      (t.reviewState === "in_review" ||
        (t.status as string) === "In Review" ||
        (t.status as string) === "in_review" ||
        t.rawStatus === "In Review" ||
        t.rawStatus === "in_review")
    );
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
