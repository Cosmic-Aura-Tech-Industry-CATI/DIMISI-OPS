import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, KeyRound, Settings2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { usePersonalActivityQuery, type ActivityLog } from "@/features/activity";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employee/history")({
  head: () => ({
    meta: [
      { title: "Activity History — Poll" },
      { name: "description", content: "Your recent activity on Poll." },
      { property: "og:title", content: "Activity History — Poll" },
      { property: "og:description", content: "Your recent activity on Poll." },
    ],
  }),
  component: HistoryPage,
});

function getIconAndColor(entityType?: string, action?: string) {
  const lower = (entityType || action || "").toLowerCase();
  if (lower.includes("task")) {
    return { Icon: Activity, color: "bg-info/15 text-info" };
  }
  if (lower.includes("auth") || lower.includes("login") || lower.includes("password")) {
    return { Icon: KeyRound, color: "bg-primary/15 text-primary" };
  }
  if (lower.includes("point") || lower.includes("reward")) {
    return { Icon: Sparkles, color: "bg-warning/15 text-warning-foreground dark:text-warning" };
  }
  return { Icon: Settings2, color: "bg-muted text-muted-foreground" };
}

function HistoryPage() {
  const { data: activityData, isLoading } = usePersonalActivityQuery({ limit: 50 });

  const logs: ActivityLog[] = useMemo(() => {
    if (Array.isArray(activityData)) return activityData;
    return (activityData as any)?.data || [];
  }, [activityData]);

  return (
    <>
      <PageHeader title="Activity History" subtitle="A timeline of your recent moves." />
      <div className="glass rounded-2xl p-6">
        {logs.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground">No recent activity found.</p>
        )}
        <ol className="relative space-y-6 border-l border-border/60 pl-6">
          {logs.map((a, i) => {
            const { Icon, color } = getIconAndColor(a.entityType, a.action);
            const actionText = (a.action || "").replace(/_/g, " ");
            const targetText =
              (a.metadata?.title as string) ||
              (a.metadata?.name as string) ||
              a.entityType ||
              "";

            return (
              <li
                key={a._id || a.id || i}
                className="relative animate-in fade-in slide-in-from-left-2"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div
                  className={cn(
                    "absolute -left-[34px] grid h-8 w-8 place-items-center rounded-full ring-4 ring-background",
                    color,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm text-muted-foreground">You</span>
                  <span>{actionText}</span>
                  <span className="font-medium">{targetText}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {a.createdAt
                    ? new Date(a.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : ""}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
