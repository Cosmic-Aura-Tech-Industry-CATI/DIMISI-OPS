import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Trophy, Zap, Star } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { currentEmployee, tasks, leaderboard } from "@/lib/mock-data";
import { Progress } from "@/components/ui/progress";

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
  const rank = leaderboard.find((l) => l.id === currentEmployee.id)?.rank ?? "—";
  const points = currentEmployee.points;
  const nextTier = tiers.find((t) => t.min > points) ?? tiers[tiers.length - 1];
  const currentTier = [...tiers].reverse().find((t) => points >= t.min)!;
  const progress = Math.min(100, Math.round(((points - currentTier.min) / Math.max(1, nextTier.min - currentTier.min)) * 100));
  const recent = tasks.filter((t) => t.assigneeId === currentEmployee.id && t.status === "completed");

  return (
    <>
      <PageHeader title="Points" subtitle="Every task you close moves you up." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total points" value={points.toLocaleString()} icon={Sparkles} delta={6.2} accent="primary" />
        <StatCard label="Current rank" value={`#${rank}`} icon={Trophy} accent="warning" />
        <StatCard label="Streak bonus" value="+45" icon={Zap} hint="7-day streak" accent="info" />
        <StatCard label="This month" value="+320" icon={Star} delta={11.4} accent="success" />
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
        <ul className="mt-3 divide-y divide-border/40">
          {recent.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · {t.category}
                </div>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-sm font-medium text-success">
                +{t.points}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
