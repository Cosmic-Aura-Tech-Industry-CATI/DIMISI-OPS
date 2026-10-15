import { createFileRoute } from "@tanstack/react-router";
import { XCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TaskCardGrid } from "@/components/task-card";
import { useTasksQuery, useAssignedTasks, type Task } from "@/features/tasks";
import { useAuth } from "@/lib/auth";
import { applySubmissions, useSubmissionMap } from "@/lib/submission-store";
import { applyReviewDecisions, useReviewMap } from "@/lib/review-store";
import { useMemo } from "react";

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
  const { data: assignedTasks = [] } = useAssignedTasks();
  const currentUserId = auth.user?.id || auth.user?._id || "";

  const combined = useMemo(() => {
    const map = new Map<string, Task>();
    [...assignedTasks, ...rawTasks].forEach((t) => {
      const id = t.id || (t as unknown as { _id?: string })._id;
      if (id && !map.has(id)) {
        map.set(id, t);
      }
    });
    return Array.from(map.values());
  }, [assignedTasks, rawTasks]);

  const list = useMemo(() => {
    return applyReviewDecisions(applySubmissions(combined, subs), reviewMap).filter((t) => {
      const isMine =
        t.assigneeId === currentUserId ||
        (auth.user?.name && t.assignee === auth.user.name) ||
        (auth.user?.email && t.assignee === auth.user.email);
      const isRejected =
        t.reviewState === "rejected" ||
        (t.status as string) === "rejected" ||
        t.reviewStatus === "rejected" ||
        Boolean(t.rejectionReason) ||
        (Boolean(t.notes) && (t.notes?.includes("Admin Feedback") ?? false));
      return isMine && isRejected;
    });
  }, [combined, subs, reviewMap, currentUserId, auth.user?.name, auth.user?.email]);

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
