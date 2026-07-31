import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  ClipboardList,
  AlarmClock,
  CheckCircle2,
  XCircle,
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
  bulkSetReviewNotifState,
  setReviewNotifState,
  useReviewNotifications,
  type ReviewNotifState,
} from "@/lib/review-store";

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

type NotifType =
  | "new_task"
  | "deadline"
  | "approved"
  | "rejected"
  | "points";

type State = "unread" | "read";

type Notif = {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  taskId?: string;
  points?: number;
  timestamp: string;
  state: State;
};

const nowIso = "2026-07-29T09:00:00Z";

function hoursAgo(h: number) {
  return new Date(new Date(nowIso).getTime() - h * 3600_000).toISOString();
}

const seed: Notif[] = [
  { id: "n1", type: "new_task",  title: "New task assigned", message: "Shikhar Dixit assigned you \"Enterprise SSO rollout\".", taskId: "t10", timestamp: hoursAgo(1), state: "unread" },
  { id: "n2", type: "deadline",  title: "Deadline in 24 hours", message: "\"Refactor billing service\" is due tomorrow.", taskId: "t1", timestamp: hoursAgo(2), state: "unread" },
  { id: "n3", type: "approved",  title: "Task approved", message: "Rhea Kapoor approved \"Fix mobile crash on iOS 19\".", taskId: "t8", timestamp: hoursAgo(5), state: "unread" },
  { id: "n4", type: "points",    title: "Points earned", message: "You earned points for completing a task.", points: 75, taskId: "t8", timestamp: hoursAgo(5), state: "unread" },
  { id: "n5", type: "rejected",  title: "Changes requested", message: "\"Legacy cron cleanup\" was rejected — check reviewer notes.", taskId: "t13", timestamp: hoursAgo(28), state: "read" },
  { id: "n6", type: "new_task",  title: "New task assigned", message: "Julian Park assigned you \"API rate-limit dashboard\".", taskId: "t11", timestamp: hoursAgo(48), state: "read" },
  { id: "n7", type: "points",    title: "Points earned", message: "You earned points for a completed task.", points: 60, taskId: "t11", timestamp: hoursAgo(50), state: "read" },
  { id: "n8", type: "deadline",  title: "Deadline this week", message: "\"Design onboarding flow v3\" is due Friday.", taskId: "t2", timestamp: hoursAgo(72), state: "read" },
  { id: "n9", type: "approved",  title: "Task approved", message: "Shikhar Dixit approved \"Roadmap workshop prep\".", taskId: "t7", timestamp: hoursAgo(120), state: "read" },
];

const meta: Record<NotifType, { label: string; Icon: typeof Bell; tone: string; ring: string }> = {
  new_task: { label: "New Task",           Icon: ClipboardList, tone: "bg-primary/15 text-primary",         ring: "ring-primary/30" },
  deadline: { label: "Deadline Reminder",  Icon: AlarmClock,    tone: "bg-primary/15 text-primary",     ring: "ring-primary/30" },
  approved: { label: "Task Approved",      Icon: CheckCircle2,  tone: "bg-primary/15 text-primary", ring: "ring-primary/30" },
  rejected: { label: "Task Rejected",      Icon: XCircle,       tone: "bg-primary/15 text-primary",       ring: "ring-primary/30" },
  points:   { label: "Points Earned",      Icon: Sparkles,      tone: "bg-primary/15 text-primary",         ring: "ring-primary/30" },
};

function formatWhen(ts: string) {
  const d = new Date(ts);
  const diffM = Math.round((new Date(nowIso).getTime() - d.getTime()) / 60000);
  if (diffM < 60) return `${diffM}m ago`;
  if (diffM < 60 * 24) return `${Math.round(diffM / 60)}h ago`;
  const days = Math.round(diffM / 60 / 24);
  return `${days}d ago`;
}

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const withinMonth = (ts: string) => {
  const t = new Date(ts).getTime();
  return Number.isNaN(t) ? true : Date.now() - t < MONTH_MS;
};

function NotificationsPage() {
  const [localItems, setItems] = useState<Notif[]>(seed);
  const reviewNotifs = useReviewNotifications();

  const items = useMemo<Notif[]>(() => {
    const mapped: Notif[] = reviewNotifs.map((n) => ({
      id: n.id,
      type: n.type === "remarks" ? "new_task" : n.type === "approved" ? "approved" : n.type === "points" ? "points" : "rejected",
      title: n.title,
      message: n.message,
      taskId: n.taskId,
      points: n.points,
      timestamp: n.timestamp,
      state: n.state === "archived" ? "read" : n.state,
    }));
    // auto-expire anything older than a month
    return [...mapped, ...localItems].filter((n) => withinMonth(n.timestamp));
  }, [reviewNotifs, localItems]);

  const isReview = (id: string) => id.startsWith("rv-");
  const [tab, setTab] = useState<State>("unread");
  const [typeFilter, setTypeFilter] = useState<NotifType | "all">("all");

  const counts = useMemo(
    () => ({
      unread: items.filter((n) => n.state === "unread").length,
      read: items.filter((n) => n.state === "read").length,
    }),
    [items],
  );


  const filtered = useMemo(() => {
    return items
      .filter((n) => n.state === tab)
      .filter((n) => (typeFilter === "all" ? true : n.type === typeFilter))
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  }, [items, tab, typeFilter]);

  const updateOne = (id: string, patch: Partial<Notif>) => {
    if (isReview(id)) {
      if (patch.state) setReviewNotifState(id, patch.state as ReviewNotifState);
      return;
    }
    setItems((xs) => xs.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };

  const markAllRead = () => {
    bulkSetReviewNotifState("unread", "read");
    setItems((xs) => xs.map((n) => (n.state === "unread" ? { ...n, state: "read" } : n)));
    toast.success("All notifications marked as read");
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Task updates, reviews, and rewards. Entries clear automatically after 30 days."
        actions={
          <Button
            variant="outline"
            className="min-h-11 w-full rounded-md sm:w-auto"
            onClick={markAllRead}
            disabled={counts.unread === 0}
          >
            <Check className="mr-1.5 h-4 w-4" /> Mark all read
          </Button>
        }
      />


      {/* Type filter chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setTypeFilter("all")}
          className={cn(
            "shrink-0 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium transition-colors",
            typeFilter === "all" ? "bg-primary/15 text-primary border-primary/40" : "hover:bg-muted",
          )}
        >
          All
        </button>
        {(Object.keys(meta) as NotifType[]).map((k) => {
          const M = meta[k];
          const active = typeFilter === k;
          return (
            <button
              key={k}
              onClick={() => setTypeFilter(k)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium transition-colors",
                active ? "bg-primary/15 text-primary border-primary/40" : "hover:bg-muted",
              )}
            >
              <M.Icon className="h-3.5 w-3.5" />
              {M.label}
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as State)}>
        <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
          <TabsTrigger value="unread" className="gap-1.5 sm:gap-2">
            Unread
            {counts.unread > 0 && (
              <Badge className="ml-0.5 h-5 px-1.5 bg-primary text-primary-foreground hover:bg-primary">
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

      {/* List */}
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
            const isUnread = n.state === "unread";
            return (
              <div
                key={n.id}
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
                    {n.points ? (
                      <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                        <Sparkles className="mr-1 h-3 w-3" />+{n.points} pts
                      </Badge>
                    ) : null}
                    {isUnread && (
                      <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-widest text-primary">
                        <Dot className="-mx-1 h-4 w-4" /> New
                      </span>
                    )}
                    <span className="w-full text-xs text-muted-foreground sm:ml-auto sm:w-auto">{formatWhen(n.timestamp)}</span>
                  </div>
                  <div className="mt-1.5 break-words font-medium">{n.title}</div>
                  <p className="mt-0.5 break-words text-sm text-muted-foreground">{n.message}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {n.taskId && (
                      <Button asChild size="sm" variant="outline" className="rounded-md">
                        <Link to="/employee/tasks/$id" params={{ id: n.taskId }}>
                          View task
                        </Link>
                      </Button>
                    )}
                    {n.state === "unread" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        onClick={() => updateOne(n.id, { state: "read" })}
                      >
                        <Check className="mr-1 h-3.5 w-3.5" /> Mark read
                      </Button>
                    )}
                    {n.state === "read" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        onClick={() => updateOne(n.id, { state: "unread" })}
                      >
                        <Bell className="mr-1 h-3.5 w-3.5" /> Mark unread
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
