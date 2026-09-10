import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/features/notifications";

type ToneType = "info" | "success" | "warning";

const toneStyles: Record<ToneType, string> = {
  info: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
};

function shortTime(ts: string | Date) {
  const diffM = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000));
  if (diffM < 60) return `${diffM}m`;
  if (diffM < 60 * 24) return `${Math.round(diffM / 60)}h`;
  return `${Math.round(diffM / 60 / 24)}d`;
}

export function NotificationsMenu() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "director";
  const [open, setOpen] = useState(false);

  const { data: rawNotifications = [] } = useNotificationsQuery();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const markReadMutation = useMarkNotificationReadMutation();

  const notifications = rawNotifications.map((n) => {
    let tone: ToneType = "info";
    if (n.type.includes("approved") || n.type.includes("points")) {
      tone = "success";
    } else if (n.type.includes("rejected") || n.type.includes("deadline")) {
      tone = "warning";
    }

    return {
      id: n._id || n.id || "",
      title: n.title,
      body: n.message,
      time: shortTime(n.createdAt),
      tone,
      unread: !n.isRead,
    };
  });

  const unread = notifications.filter((i) => i.unread).length;

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
    } catch {
      // Ignore background errors
    }
  };

  const handleNotificationClick = (id: string, isUnread: boolean) => {
    if (isUnread) {
      markReadMutation.mutate(id);
    }
    setOpen(false);
    navigate({ to: isAdmin ? "/admin/notifications" : "/employee/notifications" });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-md"
          aria-label="Notifications"
        >
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
        className="w-[calc(100vw-1.5rem)] max-w-[92vw] rounded-2xl p-0 sm:w-90 sm:max-w-95 md:w-95"
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
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending || unread === 0}
            className="flex shrink-0 items-center gap-1 whitespace-nowrap py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <Check className="h-3 w-3" /> Mark all read
          </button>
        </div>
        <ScrollArea className="max-h-[55vh] sm:max-h-80">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              You're all caught up.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id, n.unread)}
                  className={cn(
                    "flex cursor-pointer gap-2.5 px-3 py-3 transition-colors hover:bg-accent/40 sm:gap-3 sm:px-4",
                    n.unread && "bg-primary/3",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                      toneStyles[n.tone],
                    )}
                  >
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-0.5">
                      <p className="min-w-0 wrap-break text-sm font-medium">{n.title}</p>
                      <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">
                        {n.time}
                      </span>
                    </div>
                    <p className="mt-0.5 wrap-break-words text-xs text-muted-foreground">{n.body}</p>
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
