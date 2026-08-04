import { Link } from "@tanstack/react-router";
import { Activity, CalendarClock, Star, Trophy, Users } from "lucide-react";
import { IdBadge } from "@/components/id-badge";
import type { getOverviewData } from "./dashboard-data";

type OverviewData = ReturnType<typeof getOverviewData>;

/** Shared header for the small dashboard widgets: icon + title + trailing link. */
function WidgetHeader({
  icon: Icon,
  title,
  linkTo,
  linkLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  linkTo: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-display text-lg font-semibold">{title}</h3>
      </div>
      <Link to={linkTo} className="text-xs text-primary hover:underline">
        {linkLabel}
      </Link>
    </div>
  );
}

export function RecentActivities({ items }: { items: OverviewData["recentActivity"] }) {
  return (
    <div className="glass rounded-2xl p-5">
      <WidgetHeader icon={Activity} title="Recent activities" linkTo="/admin/activity" linkLabel="View all" />
      <ul className="mt-4 space-y-4">
        {items.map((a) => (
          <li key={a.id} className="flex items-start gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent text-[11px] font-semibold">
              {a.userAvatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">
                <span className="font-medium">{a.user}</span>
                {a.userCode && <> <IdBadge id={a.userCode} /></>}{" "}
                <span className="text-muted-foreground">{a.action}</span>{" "}
                <span className="font-medium">{a.target}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {new Date(a.timestamp).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function UpcomingDeadlines({ tasks }: { tasks: OverviewData["deadlines"] }) {
  return (
    <div className="glass rounded-2xl p-5">
      <WidgetHeader icon={CalendarClock} title="Upcoming deadlines" linkTo="/admin/tasks" linkLabel="All tasks" />
      <ul className="mt-4 space-y-3">
        {tasks.map((t) => {
          const days = Math.max(
            0,
            Math.ceil((+new Date(t.dueDate) - Date.now()) / (1000 * 60 * 60 * 24)),
          );
          const tone =
            days <= 2
              ? "bg-destructive/15 text-destructive"
              : days <= 5
                ? "bg-warning/15 text-warning"
                : "bg-success/15 text-success";
          return (
            <li key={t.id} className="rounded-xl border border-border/60 bg-card/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.assignee} · {t.category}</p>
                </div>
                <span className={`shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-medium ${tone}`}>
                  {days === 0 ? "Today" : `${days}d`}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function LeaderboardPreview({ entries }: { entries: OverviewData["topFive"] }) {
  return (
    <div className="glass rounded-2xl p-5">
      <WidgetHeader icon={Trophy} title="Leaderboard" linkTo="/admin/leaderboard" linkLabel="Full board" />
      <ul className="mt-4 space-y-3">
        {entries.map((e) => (
          <li key={e.id} className="flex items-center gap-3">
            <div
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                e.rank === 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              }`}
            >
              {e.rank}
            </div>
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent text-[11px] font-semibold">
              {e.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{e.name}</p>
              <p className="text-xs text-muted-foreground">{e.department}</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-primary">
              <Star className="h-3 w-3 fill-primary" /> {e.points.toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LatestEmployeesTable({ employees }: { employees: OverviewData["latestEmployees"] }) {
  return (
    <div className="glass rounded-2xl p-5 lg:col-span-2">
      <WidgetHeader
        icon={Users}
        title="Latest employees"
        linkTo="/admin/employees"
        linkLabel="Manage"
      />
      <div className="mt-4 overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full min-w-[420px] text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Name</th>
              <th className="px-4 py-2 text-left font-medium">Department</th>
              <th className="hidden px-4 py-2 text-left font-medium sm:table-cell">Joined</th>
              <th className="px-4 py-2 text-right font-medium">Points</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-t border-border/60 transition-colors hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent text-[11px] font-semibold">
                      {e.avatar}
                    </div>
                    <div>
                      <p className="font-medium leading-tight">{e.name}</p>
                      <IdBadge id={e.code} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{e.department}</td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  {new Date(e.joinedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right font-semibold">{e.points.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
