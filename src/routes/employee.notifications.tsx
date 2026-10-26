import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  ClipboardList,
  AlarmClock,
  CheckCircle2,
  Sparkles,
  Check,
  Dot,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  type NotificationItem,
} from "@/features/notifications";

export const Route = createFileRoute("/employee/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Poll" },
      { name: "description", content: "Your latest task, review, and workspace notifications." },
      { property: "og:title", content: "Notifications — Poll" },
      { property: "og:description", content: "Your latest task, review, and workspace notifications." },
    ],
  }),
  component: NotificationsPage,
});

type ReadState = "all" | "unread" | "read";

const notifMeta: Record<string, { label: string; Icon: typeof Bell; tone: string }> = {
  task_assignment: { label: "New Task", Icon: ClipboardList, tone: "bg-primary/15 text-primary" },
  task_overdue: { label: "Overdue", Icon: AlarmClock, tone: "bg-primary/15 text-primary" },
  deadline_reminder: { label: "Overdue", Icon: AlarmClock, tone: "bg-primary/15 text-primary" },
  review_action: { label: "Review Action", Icon: CheckCircle2, tone: "bg-primary/15 text-primary" },
  task_approval: { label: "Review Action", Icon: CheckCircle2, tone: "bg-primary/15 text-primary" },
  approved: { label: "Review Action", Icon: CheckCircle2, tone: "bg-primary/15 text-primary" },
  rejected: { label: "Review Action", Icon: CheckCircle2, tone: "bg-primary/15 text-primary" },
  points_earned: { label: "Points Earned", Icon: Sparkles, tone: "bg-primary/15 text-primary" },
};

const defaultMeta = { label: "Notification", Icon: Bell, tone: "bg-primary/15 text-primary" };

/**
 * Filter chips for employee notifications.
 * `apiType` maps to the NotificationType enum value sent as `?type=` query param.
 * `null` means "All" (no type filter).
 */
const filterCategories: Array<{ id: string; label: string; apiType: string | null; Icon?: typeof Bell }> = [
  { id: "all", label: "All", apiType: null },
  { id: "assignments", label: "Task Assignments", apiType: "task_assignment", Icon: ClipboardList },
  { id: "overdue", label: "Overdue", apiType: "task_overdue", Icon: AlarmClock },
  { id: "deadline", label: "Deadline", apiType: "deadline_reminder", Icon: AlarmClock },
  { id: "review_actions", label: "Review Actions", apiType: "review_action", Icon: CheckCircle2 },
  { id: "rewards", label: "Points Earned", apiType: "points_earned", Icon: Sparkles },
];

function getActionLink(n: NotificationItem): {
  to: string;
  params?: Record<string, string>;
  label: string;
} {
  if (n.taskId) {
    return { to: "/employee/tasks/$id", params: { id: n.taskId }, label: "View task" };
  }
  const type = String(n.type || "").toLowerCase();
  if (type.includes("points")) {
    return { to: "/employee/leaderboard", label: "View leaderboard" };
  }
  return { to: "/employee/tasks", label: "View my tasks" };
}

function formatWhen(ts: string | Date) {
  const diffM = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000));
  if (diffM < 60) return `${diffM}m ago`;
  if (diffM < 60 * 24) return `${Math.round(diffM / 60)}h ago`;
  const days = Math.round(diffM / 60 / 24);
  return `${days}d ago`;
}

function NotificationsPage() {
  const [tab, setTab] = useState<ReadState>("all");
  const [typeFilter, setTypeFilter] = useState<(typeof filterCategories)[number]>(filterCategories[0]);

  // API-side filtering — pass the enum type value as ?type= query param
  const { data: notifications = [], isLoading } = useNotificationsQuery(typeFilter.apiType ?? undefined);
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const unread = notifications.filter((n) => !n.isRead).length;
  const read = notifications.filter((n) => n.isRead).length;

  const filtered = notifications
    .filter((n) => {
      if (tab === "unread") return !n.isRead;
      if (tab === "read") return n.isRead;
      return true;
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      toast.success("All notifications marked as read");
    } catch (err: any) {
      toast.error(err?.message || "Failed to mark all as read");
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markReadMutation.mutateAsync(id);
    } catch (err: any) {
      toast.error(err?.message || "Failed to mark as read");
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Task updates, reviews, and rewards across your workspace."
        actions={
          <Button
            variant="outline"
            className="min-h-11 w-full rounded-md sm:w-auto"
            onClick={handleMarkAllRead}
            disabled={unread === 0 || markAllReadMutation.isPending}
          >
            <Check className="mr-1.5 h-4 w-4" /> Mark all read
          </Button>
        }
      />

      {/* Type filter chips — trigger API re-fetch on click */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filterCategories.map((cat) => {
          const active = typeFilter.id === cat.id;
          const Icon = cat.Icon;
          return (
            <button
              key={cat.id}
              onClick={() => setTypeFilter(cat)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium transition-colors",
                active ? "bg-primary/15 text-primary border-primary/40" : "hover:bg-muted",
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {cat.label}
            </button>
          );
        })}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ReadState)}>
        <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
          <TabsTrigger value="all" className="gap-1.5 sm:gap-2">
            All
            <span className="text-xs text-muted-foreground">{notifications.length}</span>
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-1.5 sm:gap-2">
            Unread
            {unread > 0 && (
              <Badge className="ml-0.5 h-5 px-1.5 bg-primary text-primary-foreground hover:bg-primary">
                {unread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read" className="gap-1.5 sm:gap-2">
            Read
            <span className="text-xs text-muted-foreground">{read}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Loading notifications…
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="You're all caught up"
          description="Nothing to show in this view. New notifications will appear here."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={
            tab === "unread"
              ? "No unread notifications"
              : tab === "read"
                ? "No read notifications"
                : "No matching notifications"
          }
          description="No notifications match your current filter selection."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((n: NotificationItem, i) => {
            const M = notifMeta[n.type] || defaultMeta;
            const isUnread = !n.isRead;
            const notifId = n._id || n.id || "";
            const actionLink = getActionLink(n);

            return (
              <div
                key={notifId}
                className={cn(
                  "glass group relative flex items-start gap-3 rounded-2xl p-3 transition-all animate-in fade-in slide-in-from-bottom-1 sm:gap-4 sm:p-4",
                  "hover:border-primary/30 hover:shadow-glow/40",
                  isUnread && "border-l-2 border-l-primary",
                )}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-4 ring-background sm:h-11 sm:w-11", M.tone)}>
                  <M.Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Badge variant="outline" className={cn("border-border/40 text-[10px] uppercase tracking-widest", M.tone)}>
                      {M.label}
                    </Badge>
                    {isUnread && (
                      <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-widest text-primary">
                        <Dot className="-mx-1 h-4 w-4" /> New
                      </span>
                    )}
                    <span className="w-full text-xs text-muted-foreground sm:ml-auto sm:w-auto">{formatWhen(n.createdAt)}</span>
                  </div>
                  <div className="mt-1.5 break-words font-medium">{n.title}</div>
                  <p className="mt-0.5 break-words text-sm text-muted-foreground">{n.message}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {actionLink.params ? (
                      <Button asChild size="sm" variant="outline" className="rounded-md">
                        <Link to={actionLink.to} params={actionLink.params as any}>
                          {actionLink.label}
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="outline" className="rounded-md">
                        <Link to={actionLink.to}>
                          {actionLink.label}
                        </Link>
                      </Button>
                    )}
                    {isUnread && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        onClick={() => handleMarkRead(notifId)}
                        disabled={markReadMutation.isPending}
                      >
                        <Check className="mr-1 h-3.5 w-3.5" /> Mark read
                      </Button>
                    )}
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
