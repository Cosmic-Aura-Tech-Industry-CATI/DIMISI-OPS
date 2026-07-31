import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff, ClipboardCheck, CheckCircle2, UserPlus, ShieldPlus, Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import {
  markAllAdminNotifsRead,
  setAdminNotifRead,
  useAdminNotifications,
  type AdminNotifType,
} from "@/lib/admin-notification-store";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Dimisi Admin" },
      { name: "description", content: "Approvals, new submissions and newly added team members." },
      { property: "og:title", content: "Notifications — Dimisi Admin" },
      { property: "og:description", content: "Approvals, new submissions and newly added team members." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminNotificationsPage,
});

const meta: Record<AdminNotifType, { label: string; Icon: typeof Bell }> = {
  approved: { label: "Task Approved", Icon: CheckCircle2 },
  submission: { label: "New Submission", Icon: ClipboardCheck },
  new_employee: { label: "New Employee", Icon: UserPlus },
  new_admin: { label: "New Admin", Icon: ShieldPlus },
};

function formatWhen(ts: string) {
  const diffM = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000));
  if (diffM < 60) return `${diffM}m ago`;
  if (diffM < 60 * 24) return `${Math.round(diffM / 60)}h ago`;
  return `${Math.round(diffM / 60 / 24)}d ago`;
}

function AdminNotificationsPage() {
  const items = useAdminNotifications();
  const [tab, setTab] = useState<"unread" | "read">("unread");
  const [typeFilter, setTypeFilter] = useState<AdminNotifType | "all">("all");

  const counts = useMemo(
    () => ({
      unread: items.filter((n) => !n.read).length,
      read: items.filter((n) => n.read).length,
    }),
    [items],
  );

  const filtered = useMemo(
    () =>
      items
        .filter((n) => (tab === "unread" ? !n.read : n.read))
        .filter((n) => (typeFilter === "all" ? true : n.type === typeFilter))
        .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)),
    [items, tab, typeFilter],
  );

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Approvals, submissions and new team members. Entries clear automatically after 30 days."
        actions={
          <Button
            variant="outline"
            className="min-h-11 w-full rounded-md sm:w-auto"
            onClick={() => {
              markAllAdminNotifsRead();
              toast.success("All notifications marked as read");
            }}
            disabled={counts.unread === 0}
          >
            <Check className="mr-1.5 h-4 w-4" /> Mark all read
          </Button>
        }
      />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setTypeFilter("all")}
          className={cn(
            "shrink-0 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium transition-colors",
            typeFilter === "all" ? "border-primary/40 bg-primary/15 text-primary" : "hover:bg-muted",
          )}
        >
          All
        </button>
        {(Object.keys(meta) as AdminNotifType[]).map((k) => {
          const M = meta[k];
          const active = typeFilter === k;
          return (
            <button
              key={k}
              onClick={() => setTypeFilter(k)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium transition-colors",
                active ? "border-primary/40 bg-primary/15 text-primary" : "hover:bg-muted",
              )}
            >
              <M.Icon className="h-3.5 w-3.5" />
              {M.label}
            </button>
          );
        })}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "unread" | "read")}>
        <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
          <TabsTrigger value="unread" className="gap-1.5 sm:gap-2">
            Unread
            {counts.unread > 0 && (
              <Badge className="ml-0.5 h-5 bg-primary px-1.5 text-primary-foreground hover:bg-primary">
                {counts.unread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read" className="gap-1.5 sm:gap-2">
            Read
            <span className="text-xs text-muted-foreground">{counts.read}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="You're all caught up"
          description="Nothing to show in this view. New notifications will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((n, i) => {
            const M = meta[n.type];
            return (
              <div
                key={n.id}
                className={cn(
                  "glass group relative flex items-start gap-3 rounded-2xl p-3 transition-all animate-in fade-in slide-in-from-bottom-1 sm:gap-4 sm:p-4",
                  "hover:border-primary/30",
                  !n.read && "border-l-2 border-l-primary",
                )}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary ring-4 ring-background sm:h-11 sm:w-11">
                  <M.Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Badge variant="outline" className="border-border/40 bg-primary/15 text-[10px] uppercase tracking-widest text-primary">
                      {M.label}
                    </Badge>
                    <span className="w-full text-xs text-muted-foreground sm:ml-auto sm:w-auto">{formatWhen(n.timestamp)}</span>
                  </div>
                  <div className="mt-1.5 break-words font-medium">{n.title}</div>
                  <p className="mt-0.5 break-words text-sm text-muted-foreground">{n.message}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {n.taskId && (
                      <Button asChild size="sm" variant="outline" className="rounded-md">
                        <Link to="/admin/tasks/$id" params={{ id: n.taskId }}>
                          View task
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-md"
                      onClick={() => setAdminNotifRead(n.id, !n.read)}
                    >
                      {n.read ? (
                        <>
                          <Bell className="mr-1 h-3.5 w-3.5" /> Mark unread
                        </>
                      ) : (
                        <>
                          <Check className="mr-1 h-3.5 w-3.5" /> Mark read
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
