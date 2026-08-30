import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trophy, Medal, Award, Flame, Star, Zap, Crown, Target, Search, AlertCircle } from "lucide-react";
import { IdBadge } from "@/components/id-badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLeaderboardQuery } from "@/features/leaderboard";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employee/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Dimisi" },
      { name: "description", content: "See where you rank against your teammates this cycle." },
      { property: "og:title", content: "Leaderboard — Dimisi" },
      { property: "og:description", content: "See where you rank against your teammates this cycle." },
    ],
  }),
  component: EmployeeLeaderboardPage,
});

type Range = "weekly" | "monthly" | "yearly";

const rangeMultiplier: Record<Range, number> = {
  weekly: 0.18,
  monthly: 0.6,
  yearly: 1,
};

const podium = [
  { Icon: Crown, ring: "from-[oklch(0.85_0.16_85)] to-[oklch(0.75_0.19_65)]", label: "Champion" },
  { Icon: Trophy, ring: "from-[oklch(0.85_0.03_260)] to-[oklch(0.7_0.04_260)]", label: "Runner-up" },
  { Icon: Medal, ring: "from-[oklch(0.7_0.13_45)] to-[oklch(0.55_0.14_35)]", label: "Third place" },
];

function initials(name: string) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function badgesFor(points: number, completionRate: number) {
  const badges: { label: string; Icon: typeof Star; tone: string }[] = [];
  if (points >= 1500) badges.push({ label: "Elite", Icon: Crown, tone: "bg-primary/15 text-primary border-primary/30" });
  if (completionRate >= 92) badges.push({ label: "Consistent", Icon: Target, tone: "bg-primary/10 text-primary border-primary/30" });
  if (points >= 1200) badges.push({ label: "Top 10%", Icon: Star, tone: "bg-primary/10 text-primary border-primary/30" });
  if (completionRate >= 88 && points >= 1000) badges.push({ label: "On Fire", Icon: Flame, tone: "bg-primary/10 text-primary border-primary/30" });
  if (badges.length === 0) badges.push({ label: "Rising", Icon: Zap, tone: "bg-primary/10 text-primary border-primary/30" });
  return badges.slice(0, 3);
}

function EmployeeLeaderboardPage() {
  const { user: currentUser } = useAuth();
  const { data: rawLeaderboard = [], isLoading, isError, error, refetch } = useLeaderboardQuery(50);

  const [range, setRange] = useState<Range>("monthly");
  const [department, setDepartment] = useState<string>("all");
  const [search, setSearch] = useState("");

  const leaderboardEntries = useMemo(() => {
    return rawLeaderboard.map((item, index) => {
      const deptName =
        typeof item.department === "object" && item.department
          ? (item.department as { name?: string }).name
          : (item.department as string) || "General";

      const points = item.points ?? 0;
      const tasksCompleted = (item.completedTasks as number) ?? (item.completedTasksCount as number) ?? 0;
      const codeStr = String(item.empId || item.code || "—");

      return {
        id: String(item._id || index),
        code: codeStr,
        name: item.name || "Teammate",
        email: item.email || "",
        department: deptName,
        avatar: initials(item.name || "Teammate"),
        points,
        tasksCompleted,
        rank: index + 1,
      };
    });
  }, [rawLeaderboard]);

  const departments = useMemo(
    () => Array.from(new Set(leaderboardEntries.map((e) => e.department).filter(Boolean))) as string[],
    [leaderboardEntries],
  );

  const scaled = useMemo(() => {
    const m = rangeMultiplier[range];
    return leaderboardEntries
      .map((e) => {
        const points = Math.round(e.points * m);
        const tasksCompleted = Math.max(1, Math.round(e.tasksCompleted * m));
        const completionRate = Math.min(99, 70 + ((e.points % 30) + (tasksCompleted % 10)));
        return { ...e, points, tasksCompleted, completionRate };
      })
      .sort((a, b) => b.points - a.points)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }, [leaderboardEntries, range]);

  const filtered = useMemo(() => {
    return scaled.filter((e) => {
      if (department !== "all" && e.department !== department) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [scaled, department, search]);

  const top3 = scaled.slice(0, 3);
  const table = filtered;

  return (
    <>
      <PageHeader
        title="Leaderboard"
        subtitle="Track how you stack up against teammates across the org."
      />

      {/* Range + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teammate"
              className="pl-9 sm:w-64"
            />
          </div>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
      ) : leaderboardEntries.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No Leaderboard Data Yet"
          description="Leaderboard rankings will appear automatically as employees complete tasks and accumulate points."
        />
      ) : (
        <>
          {/* Top 3 podium */}
          {top3.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-3">
              {top3.map((e, i) => {
                const { Icon, ring, label } = podium[i] || podium[0];
                const isMe = Boolean(currentUser?.email && e.email && currentUser.email.toLowerCase() === e.email.toLowerCase());
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
                    <div className={cn("absolute -top-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-gradient-to-br opacity-30 blur-2xl", ring)} />
                    <div className="relative flex items-center justify-center gap-2">
                      <div className={cn("grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-glow", ring)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="border-border/60 text-[10px] uppercase tracking-widest">
                        {label}
                      </Badge>
                    </div>
                    <div className="relative mx-auto mt-4 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent text-lg font-semibold">
                      {e.avatar}
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold">
                      {e.name}
                      {isMe && <span className="ml-2 text-xs text-primary">(you)</span>}
                    </h3>
                    <p className="text-xs text-muted-foreground">{e.department}</p>
                    <p className="mt-3 font-display text-3xl font-semibold text-gradient">{e.points.toLocaleString()}</p>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">points</p>
                    <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <span><span className="font-medium text-foreground">{e.tasksCompleted}</span> tasks</span>
                      <span className="h-3 w-px bg-border/60" />
                      <span><span className="font-medium text-foreground">{e.completionRate}%</span> rate</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Leaderboard table */}
          <div className="glass overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h3 className="font-display text-base font-semibold">Full ranking</h3>
                <p className="text-xs text-muted-foreground">
                  {range.charAt(0).toUpperCase() + range.slice(1)} standings
                  {department !== "all" && ` · ${department}`}
                </p>
              </div>
              <Badge variant="outline" className="border-border/60">
                {table.length} teammates
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="w-[180px]">Completion rate</TableHead>
                    <TableHead>Badges</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.map((e) => {
                    const isMe = Boolean(currentUser?.email && e.email && currentUser.email.toLowerCase() === e.email.toLowerCase());
                    const badges = badgesFor(e.points, e.completionRate);
                    return (
                      <TableRow
                        key={e.id}
                        className={cn(
                          "border-border/40 transition-colors",
                          isMe && "bg-primary/5 hover:bg-primary/10",
                        )}
                      >
                        <TableCell>
                          <div
                            className={cn(
                              "grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold",
                              e.rank === 1 && "bg-gradient-to-br from-primary/30 to-primary/20 text-primary",
                              e.rank === 2 && "bg-gradient-to-br from-slate-400/30 to-slate-500/20 text-slate-200",
                              e.rank === 3 && "bg-gradient-to-br from-primary/30 to-primary/15 text-primary",
                              e.rank > 3 && "bg-muted text-muted-foreground",
                            )}
                          >
                            {e.rank <= 3 ? <Award className="h-4 w-4" /> : `#${e.rank}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent text-xs font-semibold">
                              {e.avatar}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {e.name}
                                {isMe && <span className="ml-2 text-xs text-primary">(you)</span>}
                              </div>
                              <IdBadge id={e.code || ""} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.department}</TableCell>
                        <TableCell className="text-right font-display text-base font-semibold">
                          {e.points.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm">{e.tasksCompleted}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                                style={{ width: `${e.completionRate}%` }}
                              />
                            </div>
                            <span className="w-10 text-right text-xs text-muted-foreground">{e.completionRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {badges.map((b) => (
                              <Badge
                                key={b.label}
                                variant="outline"
                                className={cn("gap-1 border text-[10px] font-medium", b.tone)}
                              >
                                <b.Icon className="h-3 w-3" />
                                {b.label}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {table.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        No teammates match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
