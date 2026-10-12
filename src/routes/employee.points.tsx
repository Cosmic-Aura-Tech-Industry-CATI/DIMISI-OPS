import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Trophy, Zap, Star } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { useLeaderboardQuery } from "@/features/leaderboard";
import { useTasksQuery, getCategoryLabel } from "@/features/tasks";
import { useEmployeeProgressAnalyticsQuery } from "@/features/employee-dashboard";

export const Route = createFileRoute("/employee/points")({
  head: () => ({
    meta: [
      { title: "Points — Poll" },
      { name: "description", content: "See how your points stack up and what unlocks next." },
      { property: "og:title", content: "Points — Poll" },
      { property: "og:description", content: "See how your points stack up and what unlocks next." },
    ],
  }),
  component: PointsPage,
});

const tiers = [
  { name: "Bronze", min: 0, color: "from-[oklch(0.7_0.13_45)] to-[oklch(0.55_0.14_35)]" },
  { name: "Silver", min: 800, color: "from-[oklch(0.85_0.03_260)] to-[oklch(0.7_0.04_260)]" },
  { name: "Gold", min: 1500, color: "from-[oklch(0.85_0.16_85)] to-[oklch(0.75_0.19_65)]" },
  { name: "Platinum", min: 2500, color: "from-[oklch(0.75_0.19_275)] to-[oklch(0.7_0.22_320)]" },
];

function PointsPage() {
  const auth = useAuth();
  const currentUserId = auth.user?.id || auth.user?._id || "";
  const { data: leaderboard = [] } = useLeaderboardQuery(100);
  const { data: tasks = [] } = useTasksQuery();
  const { data: analytics } = useEmployeeProgressAnalyticsQuery();

  const recent = useMemo(() => {
    return tasks.filter((t) => {
      const isMine =
        (currentUserId && t.assigneeId === currentUserId) ||
        (auth.user?.name && t.assignee === auth.user.name) ||
        (auth.user?.email && t.assignee === auth.user.email);
      return isMine && (t.status === "completed" || (t.status as string) === "Completed");
    });
  }, [tasks, currentUserId, auth.user?.name, auth.user?.email]);

  const completedTasksPoints = useMemo(() => {
    return recent.reduce((sum, t) => {
      const rec = t as unknown as Record<string, unknown>;
      const pt = typeof t.points === "number" ? t.points : typeof rec.rewardPoints === "number" ? (rec.rewardPoints as number) : 0;
      return sum + pt;
    }, 0);
  }, [recent]);

  const userRankIndex = leaderboard.findIndex((item) => {
    const l = item as Record<string, unknown>;
    const lId = String(l.id || l._id || "");
    const lCode = String(l.empId || l.code || "");
    const lEmail = String(l.email || "").toLowerCase();
    const lName = String(l.name || "").toLowerCase();
    return (
      (currentUserId && (lId === currentUserId || lCode === currentUserId)) ||
      (auth.user?.email && lEmail === auth.user.email.toLowerCase()) ||
      (auth.user?.name && lName === auth.user.name.toLowerCase())
    );
  });
  const rank = userRankIndex >= 0 ? `${userRankIndex + 1}` : "—";
  const leaderboardUser = userRankIndex >= 0 ? leaderboard[userRankIndex] : null;

  const points = useMemo(() => {
    const userRec = auth.user as unknown as Record<string, unknown> | null;
    const fromAuth = typeof userRec?.points === "number" ? (userRec.points as number) : typeof userRec?.rewardPoints === "number" ? (userRec.rewardPoints as number) : undefined;
    const fromLeaderboard = leaderboardUser?.points;
    const candidates = [fromAuth, fromLeaderboard, completedTasksPoints, analytics?.monthlyPerformance?.totalPoints].filter(
      (v): v is number => typeof v === "number" && !isNaN(v) && v > 0
    );
    if (candidates.length > 0) {
      return Math.max(...candidates);
    }
    return fromAuth ?? (analytics?.monthlyPerformance?.totalPoints || 0);
  }, [auth.user, leaderboardUser, completedTasksPoints, analytics?.monthlyPerformance?.totalPoints]);

  const monthlyPoints = analytics?.monthlyPerformance?.totalPoints ?? 0;

  const nextTier = tiers.find((t) => t.min > points) ?? tiers[tiers.length - 1];
  const currentTier = [...tiers].reverse().find((t) => points >= t.min) || tiers[0];
  const progress = Math.min(100, Math.round(((points - currentTier.min) / Math.max(1, nextTier.min - currentTier.min)) * 100));

  return (
    <>
      <PageHeader title="Points" subtitle="Every task you close moves you up." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total points" value={points.toLocaleString()} icon={Sparkles} accent="primary" />
        <StatCard label="Current rank" value={`#${rank}`} icon={Trophy} accent="warning" />
        <StatCard label="Completed tasks" value={`${recent.length}`} icon={Zap} hint="Verified closes" accent="info" />
        <StatCard label="This month" value={`+${monthlyPoints}`} icon={Star} accent="success" />
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Current tier</p>
            <h3 className="font-display text-2xl font-semibold">{currentTier.name}</h3>
          </div>
          <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-glow ${currentTier.color}`}>
            <Trophy className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{points.toLocaleString()} points</span>
            <span className="font-medium">
              {nextTier.name === currentTier.name ? "Max tier reached" : `${(nextTier.min - points).toLocaleString()} to ${nextTier.name}`}
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
        <div className="mt-6 grid grid-cols-4 gap-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`rounded-xl border p-3 text-center text-xs ${
                t.name === currentTier.name ? "border-primary bg-primary/10" : "border-border/60"
              }`}
            >
              <div className={`mx-auto mb-2 h-6 w-6 rounded-full bg-gradient-to-br ${t.color}`} />
              <div className="font-medium">{t.name}</div>
              <div className="text-muted-foreground">{t.min.toLocaleString()}+</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-display text-lg font-semibold">Points history</h3>
        {recent.length === 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">No completed tasks yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/40">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Completed"} · {getCategoryLabel(t.category)}
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-sm font-medium text-success">
                  +{t.points}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
