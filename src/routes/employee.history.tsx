import { createFileRoute } from "@tanstack/react-router";
import { Activity, KeyRound, Settings2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { activityLogs, currentEmployee } from "@/lib/mock-data";
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

const iconFor = { task: Activity, auth: KeyRound, system: Settings2, reward: Sparkles };
const colorFor = {
  task: "bg-info/15 text-info",
  auth: "bg-primary/15 text-primary",
  system: "bg-muted text-muted-foreground",
  reward: "bg-warning/15 text-warning-foreground dark:text-warning",
};

function HistoryPage() {
  const mine = activityLogs.filter((a) => a.user === currentEmployee.name).concat(activityLogs.slice(0, 3));
  return (
    <>
      <PageHeader title="Activity History" subtitle="A timeline of your recent moves." />
      <div className="glass rounded-2xl p-6">
        <ol className="relative space-y-6 border-l border-border/60 pl-6">
          {mine.map((a, i) => {
            const Icon = iconFor[a.type];
            return (
              <li key={`${a.id}-${i}`} className="relative animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${i * 40}ms` }}>
                <div className={cn("absolute -left-[34px] grid h-8 w-8 place-items-center rounded-full ring-4 ring-background", colorFor[a.type])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm text-muted-foreground">You</span>
                  <span>{a.action}</span>
                  <span className="font-medium">{a.target}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
