import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Trophy, Medal, Award, AlertCircle } from "lucide-react";
import { IdBadge } from "@/components/id-badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderboardQuery } from "@/features/leaderboard";
import { useEmployeesQuery } from "@/features/employees";
import type { AuthUser } from "@/auth/types/auth";
import { UserAvatar, getAvatarUrl } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

export interface AdminLeaderboardSearch {
  period?: "weekly" | "monthly" | "yearly";
}

export const Route = createFileRoute("/admin/leaderboard")({
  validateSearch: (search: Record<string, unknown>): AdminLeaderboardSearch => {
    const p = search.period as string;
    if (p === "weekly" || p === "yearly") {
      return { period: p };
    }
    return { period: "monthly" };
  },
  head: () => ({
    meta: [
      { title: "Leaderboard — Dimisi" },
      { name: "description", content: "See who's leading the pack." },
      { property: "og:title", content: "Leaderboard — Dimisi" },
      { property: "og:description", content: "See who's leading the pack." },
    ],
  }),
  component: LeaderboardPage,
});

const podium = [Trophy, Medal, Award];
const podiumColor = [
  "from-[oklch(0.85_0.16_85)] to-[oklch(0.75_0.19_65)]",
  "from-[oklch(0.85_0.03_260)] to-[oklch(0.7_0.04_260)]",
  "from-[oklch(0.7_0.13_45)] to-[oklch(0.55_0.14_35)]",
];

function initials(name: string) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function LeaderboardPage() {
  const {
    data: rawLeaderboard = [],
    isLoading: isLeaderboardLoading,
    isError,
    error,
    refetch,
  } = useLeaderboardQuery(50);
  const { data: employeesData, isLoading: isEmployeesLoading } = useEmployeesQuery({ limit: 100 });

  const isLoading = isLeaderboardLoading || isEmployeesLoading;

  const employeeDirectoryMap = useMemo(() => {
    const map = new Map<
      string,
      { isActive: boolean; status?: string; avatarUrl?: string; raw: AuthUser }
    >();
    (employeesData?.employees || []).forEach((emp) => {
      const avatarUrl = getAvatarUrl(emp);
      const isActive = typeof emp.isActive === "boolean" ? emp.isActive : true;
      const info = {
        isActive,
        status: isActive ? "active" : "inactive",
        avatarUrl,
        raw: emp,
      };
      if (emp._id) map.set(String(emp._id), info);
      if (emp.id) map.set(String(emp.id), info);
      if (emp.empId) map.set(String(emp.empId), info);
      if (emp.code) map.set(String(emp.code), info);
      if (emp.email) map.set(emp.email.toLowerCase(), info);
    });
    return map;
  }, [employeesData]);

  const leaderboard = useMemo(() => {
    const items = Array.isArray(rawLeaderboard) ? rawLeaderboard : [];

    // Strictly ensure only confirmed active employees appear in leaderboard rankings
    const activeItems = items.filter((item) => {
      // 1. Explicit negative checks on entry
      if (item.isActive === false || (item as Record<string, unknown>).is_active === false) return false;
      if (typeof item.status === "string" && item.status.trim().toLowerCase() !== "active")
        return false;
      if (item.user && item.user.isActive === false) return false;
      if (
        item.user &&
        typeof item.user.status === "string" &&
        item.user.status.trim().toLowerCase() !== "active"
      )
        return false;

      // 2. Explicit positive checks on entry
      if (item.isActive === true || (item as Record<string, unknown>).is_active === true) return true;
      if (typeof item.status === "string" && item.status.trim().toLowerCase() === "active")
        return true;
      if (item.user && item.user.isActive === true) return true;
      if (
        item.user &&
        typeof item.user.status === "string" &&
        item.user.status.trim().toLowerCase() === "active"
      )
        return true;

      // 3. Match against employee directory
      const keys = [
        item._id,
        (item as Record<string, unknown>).id,
        item.empId,
        item.code,
        item.email?.toLowerCase(),
      ].filter(Boolean);
      for (const k of keys) {
        const match = employeeDirectoryMap.get(String(k));
        if (match) {
          if (typeof match.isActive === "boolean") return match.isActive;
          if (typeof match.status === "string" && match.status.trim() !== "") {
            return match.status.trim().toLowerCase() === "active";
          }
        }
      }

      // Strictly: Do not assume an employee is active when their status is missing or unknown
      return false;
    });

    return activeItems
      .map((item, index) => {
        const deptName =
          typeof item.department === "object" && item.department
            ? (item.department as { name?: string }).name
            : (item.department as string) || "General";

        const codeStr = String(item.empId || item.code || "—");
        const points = typeof item.points === "number" ? item.points : 0;
        const matched =
          employeeDirectoryMap.get(String(item._id || "")) ||
          employeeDirectoryMap.get(String((item as Record<string, unknown>).id || "")) ||
          employeeDirectoryMap.get(codeStr) ||
          (item.email ? employeeDirectoryMap.get(item.email.toLowerCase()) : undefined);

        const avatarUrl =
          getAvatarUrl(item) ||
          getAvatarUrl(item.user) ||
          matched?.avatarUrl ||
          (matched?.raw ? getAvatarUrl(matched.raw) : undefined);

        return {
          id: String(item._id || index),
          name: item.name || "Employee",
          code: codeStr,
          department: deptName,
          avatar: initials(item.name || "Employee"),
          avatarUrl,
          points,
          tasksCompleted:
            (item.completedTasks as number) ?? (item.completedTasksCount as number) ?? 0,
          raw: matched?.raw || item,
        };
      })
      .sort((a, b) => b.points - a.points)
      .map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
      }));
  }, [rawLeaderboard, employeeDirectoryMap]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <>
      <PageHeader title="Leaderboard" subtitle="The top performers, powered by points." />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h3 className="font-semibold text-destructive">Failed to load leaderboard</h3>
          <p className="text-sm text-muted-foreground">{error?.message || "An error occurred."}</p>
          <button
            onClick={() => void refetch()}
            className="mt-2 rounded-md bg-primary px-4 py-2 text-xs text-primary-foreground"
          >
            Retry
          </button>
        </div>
      ) : leaderboard.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No Leaderboard Data Yet"
          description="Leaderboard rankings will appear automatically as employees complete tasks and accumulate points."
        />
      ) : (
        <>
          {top3.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-3">
              {top3.map((e, i) => {
                const Icon = podium[i] || Trophy;
                return (
                  <div
                    key={e.id}
                    className={cn(
                      "glass relative overflow-hidden rounded-2xl p-6 text-center animate-in fade-in slide-in-from-bottom-3",
                      i === 0 && "sm:order-2 sm:scale-105",
                      i === 1 && "sm:order-1",
                      i === 2 && "sm:order-3",
                    )}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div
                      className={cn(
                        "absolute -top-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-gradient-to-br opacity-30 blur-2xl",
                        podiumColor[i],
                      )}
                    />
                    <div
                      className={cn(
                        "relative mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-glow",
                        podiumColor[i],
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <UserAvatar
                      user={e.raw}
                      name={e.name}
                      image={e.avatarUrl}
                      className="relative mx-auto mt-4 h-16 w-16 text-lg"
                      fallbackClassName="text-lg bg-gradient-to-br from-primary/30 to-accent text-foreground font-semibold"
                    />
                    <h3 className="mt-3 font-display text-lg font-semibold">{e.name}</h3>
                    <div className="mt-1">
                      <IdBadge id={e.code} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{e.department}</p>
                    <p className="mt-3 font-display text-3xl font-semibold text-gradient">
                      {e.points.toLocaleString()}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      points
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {rest.length > 0 && (
            <div className="glass overflow-hidden rounded-2xl">
              <ul className="divide-y divide-border/40">
                {rest.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-xs font-semibold">
                      #{e.rank}
                    </div>
                    <UserAvatar
                      user={e.raw}
                      name={e.name}
                      image={e.avatarUrl}
                      className="h-10 w-10 text-sm"
                      fallbackClassName="text-sm bg-gradient-to-br from-primary/30 to-accent text-foreground font-semibold"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{e.name}</div>
                      <div className="flex items-center gap-2 truncate text-xs text-muted-foreground">
                        <IdBadge id={e.code} /> {e.department}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg font-semibold">
                        {e.points.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">{e.tasksCompleted} tasks</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </>
  );
}
