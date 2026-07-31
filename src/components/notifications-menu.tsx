import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { noticeTypeMeta, useEmployeeNotices } from "@/lib/notice-store";
import { bulkSetReviewNotifState, useReviewNotifications } from "@/lib/review-store";
import { markAllAdminNotifsRead, useAdminNotifications } from "@/lib/admin-notification-store";

type Notif = {
  id: string;
  title: string;
  body: string;
  time: string;
  tone: "info" | "success" | "warning";
  unread: boolean;
};

const toneStyles: Record<Notif["tone"], string> = {
  info: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
};

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const withinMonth = (ts: string) => {
  const t = new Date(ts).getTime();
  return Number.isNaN(t) ? true : Date.now() - t < MONTH_MS;
};

function shortTime(ts: string) {
  const diffM = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000));
  if (diffM < 60) return `${diffM}m`;
  if (diffM < 60 * 24) return `${Math.round(diffM / 60)}h`;
  return `${Math.round(diffM / 60 / 24)}d`;
}

export function NotificationsMenu() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [open, setOpen] = useState(false);
  const [readNotices, setReadNotices] = useState<string[]>([]);
  const notices = useEmployeeNotices();
  const reviewNotifs = useReviewNotifications();
  const adminNotifs = useAdminNotifications();

  const employeeItems: Notif[] = reviewNotifs
    .filter((n) => n.state !== "archived" && withinMonth(n.timestamp))
    .map((n) => ({
      id: n.id,
      title: n.title,
      body: n.message,
      time: shortTime(n.timestamp),
      tone: n.type === "rejected" ? "warning" : n.type === "approved" || n.type === "points" ? "success" : "info",
      unread: n.state === "unread",
    }));

  const noticeItems: Notif[] = isAdmin
    ? []
    : notices.map((n) => ({
        id: `notice-${n.id}`,
        title: `${noticeTypeMeta[n.type].icon} ${n.headline}`,
        body: n.content.length > 90 ? `${n.content.slice(0, 90)}…` : n.content,
        time: n.publishDate,
        tone: n.priority === "urgent" || n.priority === "high" ? "warning" : "info",
        unread: !readNotices.includes(n.id),
      }));

  const adminItems: Notif[] = adminNotifs.filter((n) => withinMonth(n.timestamp)).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.message,
    time: shortTime(n.timestamp),
    tone: n.type === "approved" ? "success" : "info",
    unread: !n.read,
  }));

  const all = isAdmin ? adminItems : [...employeeItems, ...noticeItems];
  const unread = all.filter((i) => i.unread).length;

  const markAllRead = () => {
    if (isAdmin) {
      markAllAdminNotifsRead();
      return;
    }
    bulkSetReviewNotifState("unread", "read");
    setReadNotices(notices.map((n) => n.id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-md" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground shadow-glow">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={12}
        sideOffset={8}
        className="w-[calc(100vw-1.5rem)] max-w-[92vw] rounded-2xl p-0 sm:w-[360px] sm:max-w-[380px] md:w-[380px]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-display text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <Badge variant="secondary" className="shrink-0 rounded-full px-2 text-[10px]">
                {unread} new
              </Badge>
            )}
          </div>
          <button
            onClick={markAllRead}
            className="flex shrink-0 items-center gap-1 whitespace-nowrap py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Check className="h-3 w-3" /> Mark all read
          </button>
        </div>
        <ScrollArea className="max-h-[55vh] sm:max-h-80">
          {all.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">You're all caught up.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {all.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "flex gap-2.5 px-3 py-3 transition-colors hover:bg-accent/40 sm:gap-3 sm:px-4",
                    n.unread && "bg-primary/[0.03]",
                  )}
                >
                  <div className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg", toneStyles[n.tone])}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-0.5">
                      <p className="min-w-0 break-words text-sm font-medium">{n.title}</p>
                      <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">{n.time}</span>
                    </div>
                    <p className="mt-0.5 break-words text-xs text-muted-foreground">{n.body}</p>
                  </div>
                  {n.unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <div className="border-t border-border/60 px-4 py-2 text-center">
          <button
            onClick={() => {
              setOpen(false);
              navigate({ to: isAdmin ? "/admin/notifications" : "/employee/notifications" });
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all notifications
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
