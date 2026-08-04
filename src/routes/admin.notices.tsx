import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { NoticeComposer } from "@/components/notices/notice-composer";
import { NoticeFilters } from "@/components/notices/notice-filters";
import { AdminNoticeCard } from "@/components/notices/admin-notice-card";
import {
  DeleteNoticeDialog,
  EditNoticeDialog,
  ViewNoticeDialog,
} from "@/components/notices/notice-dialogs";
import { useNoticeFilters } from "@/components/notices/use-notice-filters";
import type { Notice } from "@/lib/notice-store";

export const Route = createFileRoute("/admin/notices")({
  head: () => ({
    meta: [
      { title: "Notice Board — Poll" },
      { name: "description", content: "Create and manage company announcements for every team." },
      { property: "og:title", content: "Notice Board — Poll" },
      { property: "og:description", content: "Create and manage company announcements for every team." },
    ],
  }),
  component: AdminNoticeBoard,
});

function AdminNoticeBoard() {
  const { filtered, counts, query, setQuery, filter, setFilter } = useNoticeFilters();
  const [viewing, setViewing] = useState<Notice | null>(null);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [deleting, setDeleting] = useState<Notice | null>(null);

  return (
    <>
      <PageHeader
        title="Notice Board"
        subtitle="Create and manage company announcements."
        icon={Megaphone}
      />

      <NoticeComposer />

      <section className="space-y-4">
        <NoticeFilters
          query={query}
          onQueryChange={setQuery}
          filter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />

        {filtered.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No notices found"
            description="Try a different search or filter, or publish a new notice above."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map((n, i) => (
              <AdminNoticeCard
                key={n.id}
                notice={n}
                index={i}
                onView={() => setViewing(n)}
                onEdit={() => setEditing(n)}
                onDelete={() => setDeleting(n)}
              />
            ))}
          </div>
        )}
      </section>

      <ViewNoticeDialog notice={viewing} onClose={() => setViewing(null)} />
      <EditNoticeDialog notice={editing} onClose={() => setEditing(null)} />
      <DeleteNoticeDialog notice={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}
