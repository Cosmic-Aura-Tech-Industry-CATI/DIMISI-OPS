import { Link } from "@tanstack/react-router";
import { Activity, CalendarClock, Star, Trophy, Users } from "lucide-react";
import { IdBadge } from "@/components/id-badge";
import type { AuthUser } from "@/auth/types/auth";
import type { LeaderboardEntry } from "@/features/leaderboard/types";
import type { Task } from "@/features/tasks/types";

export interface DashboardActivityItem {
  id: string;
  user: string;
  userAvatar?: string;
  userCode?: string;
  action: string;
  target: string;
  timestamp: string | number | Date;
}

/** Safely converts string / number / populated object ({ _id, name }) to a displayable string. */
function getDisplayName(val: any, fallback = "—"): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val.trim() || fallback;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    if (typeof val.name === "string" && val.name.trim()) return val.name;
    if (typeof val.title === "string" && val.title.trim()) return val.title;
    if (typeof val.label === "string" && val.label.trim()) return val.label;
    if (typeof val.username === "string" && val.username.trim()) return val.username;
    if (typeof val._id === "string") return val._id;
  }
  return fallback;
}

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

export function RecentActivities({ items = [] }: { items?: DashboardActivityItem[] }) {
  return (
    <div className="glass rounded-2xl p-5">
      <WidgetHeader icon={Activity} title="Recent activities" linkTo="/admin/activity" linkLabel="View all" />
      {items.length === 0 ? (
        <div className="mt-6 flex h-36 flex-col items-center justify-center text-center text-xs text-muted-foreground">
          <Activity className="mb-2 h-6 w-6 opacity-40" />
          No recent activity logged
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {items.map((a) => {
            const user = getDisplayName(a.user, "User");
            const action = getDisplayName(a.action, "updated");
            const target = getDisplayName(a.target, "item");
            const avatar = a.userAvatar || user.slice(0, 2).toUpperCase();

            return (
              <li key={a.id} className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent text-[11px] font-semibold">
                  {avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <span className="font-medium">{user}</span>
                    {a.userCode && <> <IdBadge id={a.userCode} /></>}{" "}
                    <span className="text-muted-foreground">{action}</span>{" "}
                    <span className="font-medium">{target}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(a.timestamp).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function UpcomingDeadlines({ tasks = [] }: { tasks?: Task[] }) {
  return (
    <div className="glass rounded-2xl p-5">
      <WidgetHeader icon={CalendarClock} title="Upcoming deadlines" linkTo="/admin/tasks" linkLabel="All tasks" />
      {tasks.length === 0 ? (
        <div className="mt-6 flex h-36 flex-col items-center justify-center text-center text-xs text-muted-foreground">
          <CalendarClock className="mb-2 h-6 w-6 opacity-40" />
          No upcoming task deadlines
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {tasks.map((t) => {
            const dueDate = t.dueDate || "";
            const days = dueDate
              ? Math.max(0, Math.ceil((+new Date(dueDate) - Date.now()) / (1000 * 60 * 60 * 24)))
              : 0;
            const tone =
              days <= 2
                ? "bg-destructive/15 text-destructive"
                : days <= 5
                  ? "bg-warning/15 text-warning"
                  : "bg-success/15 text-success";
            const title = getDisplayName(t.title, "Task");
            const assigneeName = getDisplayName(t.assignee, "Unassigned");
            const categoryName = getDisplayName(t.category || t.taskType, "General");

            return (
              <li key={t.id || (t as any)._id} className="rounded-xl border border-border/60 bg-card/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {assigneeName} · {categoryName}
                    </p>
                  </div>
                  {dueDate && (
                    <span className={`shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-medium ${tone}`}>
                      {days === 0 ? "Today" : `${days}d`}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function LeaderboardPreview({ entries = [] }: { entries?: LeaderboardEntry[] }) {
  return (
    <div className="glass rounded-2xl p-5">
      <WidgetHeader icon={Trophy} title="Leaderboard" linkTo="/admin/leaderboard" linkLabel="Full board" />
      {entries.length === 0 ? (
        <div className="mt-6 flex h-36 flex-col items-center justify-center text-center text-xs text-muted-foreground">
          <Trophy className="mb-2 h-6 w-6 opacity-40" />
          No leaderboard entries yet
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {entries.map((e, index) => {
            const rank = e.rank ?? index + 1;
            const name = getDisplayName(e.name || e.user?.name || e.user, "User");
            const avatar = name.slice(0, 2).toUpperCase();
            const departmentName = getDisplayName(
              e.user?.department || (e as any).department || (e as any).departmentId,
              "General"
            );

            return (
              <li key={e._id || index} className="flex items-center gap-3">
                <div
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    rank === 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}
                >
                  {rank}
                </div>
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent text-[11px] font-semibold">
                  {avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">{departmentName}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                  <Star className="h-3 w-3 fill-primary" /> {Number(e.points || 0).toLocaleString()}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function LatestEmployeesTable({ employees = [] }: { employees?: AuthUser[] }) {
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
            {employees.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-xs text-muted-foreground">
                  No employees found in directory
                </td>
              </tr>
            ) : (
              employees.map((e) => {
                const name = getDisplayName(e.name, "Employee");
                const avatar = name.slice(0, 2).toUpperCase();
                const departmentName = getDisplayName(e.department || (e as any).departmentId, "—");
                const joinedDate = e.joinDate || e.createdAt;

                return (
                  <tr key={e.id || e._id} className="border-t border-border/60 transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent text-[11px] font-semibold">
                          {avatar}
                        </div>
                        <div>
                          <p className="font-medium leading-tight">{name}</p>
                          {e.code && <IdBadge id={e.code} />}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{departmentName}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {joinedDate
                        ? new Date(joinedDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{Number(e.points || 0).toLocaleString()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


