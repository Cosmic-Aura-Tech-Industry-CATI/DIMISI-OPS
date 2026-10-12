import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Gauge,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCENT, GRID_STROKE, axisStyle, chartColorAt, tooltipStyle } from "@/components/reports/chart-theme";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useTasksQuery, getCategoryLabel } from "@/features/tasks";
import { useEmployeeProgressAnalyticsQuery } from "@/features/employee-dashboard";
import { useLeaderboardQuery } from "@/features/leaderboard";

export const Route = createFileRoute("/employee/statistics")({
  head: () => ({
    meta: [
      { title: "Statistics — Dimisi" },
      { name: "description", content: "Track your task completion, points, and performance trends." },
      { property: "og:title", content: "Statistics — Dimisi" },
      { property: "og:description", content: "Track your task completion, points, and performance trends." },
    ],
  }),
  component: StatisticsPage,
});

function StatisticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const auth = useAuth();
  const currentUserId = auth.user?.id || auth.user?._id || "";
  const { data: tasks = [], isLoading: isTasksLoading } = useTasksQuery();
  const { data: analytics, isLoading: isAnalyticsLoading } = useEmployeeProgressAnalyticsQuery();
  const { data: leaderboard = [] } = useLeaderboardQuery(100);

  const mine = useMemo(() => {
    return tasks.filter((t) => {
      const rec = t as unknown as Record<string, unknown>;
      const assignedId = String(t.assigneeId || rec.assignedTo || "");
      return (
        (currentUserId && assignedId === currentUserId) ||
        (auth.user?.name && t.assignee === auth.user.name) ||
        (auth.user?.email && t.assignee === auth.user.email)
      );
    });
  }, [tasks, currentUserId, auth.user?.name, auth.user?.email]);

  const completed = useMemo(
    () => mine.filter((t) => t.status === "completed" || (t.status as string) === "Completed"),
    [mine]
  );

  const inReview = useMemo(
    () =>
      mine.filter(
        (t) =>
          t.reviewState === "in_review" ||
          (t.status as string) === "in_review" ||
          (t.status as string) === "In Review"
      ),
    [mine]
  );

  const rejectedTasks = useMemo(
    () =>
      mine.filter((t) => {
        const s = (t.status as string) || "";
        const r = (t as unknown as Record<string, unknown>).reviewState as string;
        return s === "rejected" || s === "Rejected" || r === "rejected";
      }),
    [mine]
  );

  const completedTasksPoints = useMemo(() => {
    return completed.reduce((sum, t) => {
      const rec = t as unknown as Record<string, unknown>;
      const pt =
        typeof t.points === "number"
          ? t.points
          : typeof rec.rewardPoints === "number"
            ? (rec.rewardPoints as number)
            : 0;
      return sum + pt;
    }, 0);
  }, [completed]);

  const myLeaderboardEntry = useMemo(() => {
    return leaderboard.find((item) => {
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
  }, [leaderboard, currentUserId, auth.user?.email, auth.user?.name]);

  const totalPoints = useMemo(() => {
    const userRec = auth.user as unknown as Record<string, unknown> | null;
    const fromAuth =
      typeof userRec?.points === "number"
        ? (userRec.points as number)
        : typeof userRec?.rewardPoints === "number"
          ? (userRec.rewardPoints as number)
          : undefined;
    const fromLeaderboard = myLeaderboardEntry?.points;
    const fromAnalytics = analytics?.monthlyPerformance?.totalPoints;
    const candidates = [
      fromAnalytics,
      fromAuth,
      fromLeaderboard,
      completedTasksPoints,
    ].filter((v): v is number => typeof v === "number" && !isNaN(v) && v > 0);
    if (candidates.length > 0) {
      return Math.max(...candidates);
    }
    return fromAnalytics ?? fromAuth ?? 0;
  }, [auth.user, myLeaderboardEntry, completedTasksPoints, analytics?.monthlyPerformance?.totalPoints]);

  // Monthly Analytics derived metrics from employeeDashboard.analytics
  const monthlyStats = useMemo(() => {
    const perf = analytics?.monthlyPerformance;
    const pointsGoal = perf?.pointsGoal || 600;
    const pointsEarned = totalPoints > 0 ? totalPoints : (perf?.totalPoints || 0);
    const progressPct = Math.min(100, Math.round((pointsEarned / pointsGoal) * 100));
    const daysPassed = Math.max(1, new Date().getDate());
    const avgPerDay =
      typeof perf?.avgPointsPerDay === "number" && perf.avgPointsPerDay > 0
        ? perf.avgPointsPerDay
        : Math.round(pointsEarned / daysPassed);
    const bestDay = perf?.bestDayPoints || 0;
    const tasksPerWeek =
      typeof perf?.tasksPerWeekAvg === "number" && perf.tasksPerWeekAvg > 0
        ? perf.tasksPerWeekAvg
        : Math.round((completed.length / daysPassed) * 7);

    return {
      pointsGoal,
      pointsEarned,
      progressPct,
      avgPerDay,
      bestDay,
      tasksPerWeek,
      remainingPoints: Math.max(0, pointsGoal - pointsEarned),
    };
  }, [analytics?.monthlyPerformance, totalPoints, completed.length]);

  // Turnaround in days from real task timestamps
  const turnaroundDays = useMemo(() => {
    if (completed.length === 0) return 0;
    let totalDays = 0;
    let counted = 0;
    completed.forEach((t) => {
      const start = t.createdAt ? new Date(t.createdAt).getTime() : 0;
      const finish = t.updatedAt
        ? new Date(t.updatedAt).getTime()
        : t.dueDate
          ? new Date(t.dueDate).getTime()
          : 0;
      if (start && finish && finish >= start) {
        totalDays += (finish - start) / (1000 * 60 * 60 * 24);
        counted++;
      }
    });
    return counted > 0 ? Number((totalDays / counted).toFixed(1)) : 0;
  }, [completed]);

  // Continuous active daily streak
  const activeStreak = useMemo(() => {
    if (mine.length === 0) return 0;
    const activeDates = new Set<string>();
    mine.forEach((t) => {
      if (t.status === "completed" && t.updatedAt) {
        activeDates.add(new Date(t.updatedAt).toISOString().slice(0, 10));
      } else if (t.createdAt) {
        activeDates.add(new Date(t.createdAt).toISOString().slice(0, 10));
      }
    });
    if (activeDates.size === 0) return 0;
    let streak = 0;
    const todayDate = new Date();
    for (let i = 0; i < 60; i++) {
      const checkDate = new Date(todayDate);
      checkDate.setDate(todayDate.getDate() - i);
      const dateStr = checkDate.toISOString().slice(0, 10);
      if (activeDates.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [mine]);

  // Dynamic trend dataset (7d, 30d, 90d) integrating backend analytics
  const trendData = useMemo(() => {
    const now = new Date();
    if (timeRange === "7d") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - currentDayIndex);
      startOfWeek.setHours(0, 0, 0, 0);

      return days.map((day, idx) => {
        const dayStart = new Date(startOfWeek);
        dayStart.setDate(startOfWeek.getDate() + idx);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const dayTasks = mine.filter((t) => {
          const isDone = t.status === "completed" || (t.status as string) === "Completed";
          if (!isDone) return false;
          const d = t.updatedAt
            ? new Date(t.updatedAt)
            : t.dueDate
              ? new Date(t.dueDate)
              : t.createdAt
                ? new Date(t.createdAt)
                : null;
          return d ? d >= dayStart && d <= dayEnd : false;
        });

        const dayPts = dayTasks.reduce((sum, t) => {
          const rec = t as unknown as Record<string, unknown>;
          return (
            sum +
            (typeof t.points === "number"
              ? t.points
              : typeof rec.rewardPoints === "number"
                ? (rec.rewardPoints as number)
                : 0)
          );
        }, 0);

        const fromAnalytics = analytics?.weeklyProgress?.find((w) => w.day === day);
        const plannedTasks = fromAnalytics?.planned ?? 0;
        const finalCompleted = Math.max(dayTasks.length, fromAnalytics?.completed || 0);
        const finalPoints = dayPts > 0 ? dayPts : finalCompleted * 25;

        return {
          day,
          points: finalPoints,
          tasks: finalCompleted,
          planned: plannedTasks,
        };
      });
    }

    if (timeRange === "90d") {
      return Array.from({ length: 12 }, (_, i) => 11 - i).map((wIdx, idx) => {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - wIdx * 7);
        weekEnd.setHours(23, 59, 59, 999);

        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        const weekTasks = mine.filter((t) => {
          const isDone = t.status === "completed" || (t.status as string) === "Completed";
          if (!isDone) return false;
          const d = t.updatedAt
            ? new Date(t.updatedAt)
            : t.dueDate
              ? new Date(t.dueDate)
              : t.createdAt
                ? new Date(t.createdAt)
                : null;
          return d ? d >= weekStart && d <= weekEnd : false;
        });

        const weekPts = weekTasks.reduce((sum, t) => {
          const rec = t as unknown as Record<string, unknown>;
          return (
            sum +
            (typeof t.points === "number"
              ? t.points
              : typeof rec.rewardPoints === "number"
                ? (rec.rewardPoints as number)
                : 0)
          );
        }, 0);

        return {
          week: `W${idx + 1}`,
          points: weekPts,
          tasks: weekTasks.length,
          planned: Math.max(weekTasks.length, 1),
        };
      });
    }

    // 30d (4 weeks)
    return [3, 2, 1, 0].map((wIdx, idx) => {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - wIdx * 7);
      weekEnd.setHours(23, 59, 59, 999);

      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const weekTasks = mine.filter((t) => {
        const isDone = t.status === "completed" || (t.status as string) === "Completed";
        if (!isDone) return false;
        const d = t.updatedAt
          ? new Date(t.updatedAt)
          : t.dueDate
            ? new Date(t.dueDate)
            : t.createdAt
              ? new Date(t.createdAt)
              : null;
        return d ? d >= weekStart && d <= weekEnd : false;
      });

      const weekPts = weekTasks.reduce((sum, t) => {
        const rec = t as unknown as Record<string, unknown>;
        return (
          sum +
          (typeof t.points === "number"
            ? t.points
            : typeof rec.rewardPoints === "number"
              ? (rec.rewardPoints as number)
              : 0)
        );
      }, 0);

      const isCurrentWeek = wIdx === 0;
      const finalWeekPts =
        isCurrentWeek && weekPts === 0 && analytics?.monthlyPerformance?.totalPoints
          ? analytics.monthlyPerformance.totalPoints
          : weekPts;

      return {
        week: `Week ${idx + 1}`,
        points: finalWeekPts,
        tasks: weekTasks.length,
        planned: Math.max(weekTasks.length, analytics?.monthlyPerformance?.tasksPerWeekAvg || 1),
      };
    });
  }, [timeRange, mine, analytics?.weeklyProgress, analytics?.monthlyPerformance]);

  const xKey = timeRange === "7d" ? "day" : "week";

  // Velocity percentage change
  const velocityChange = useMemo(() => {
    if (trendData.length < 2) return "+0.0%";
    const mid = Math.floor(trendData.length / 2);
    const firstHalf = trendData.slice(0, mid).reduce((sum, d) => sum + d.points, 0);
    const secondHalf = trendData.slice(mid).reduce((sum, d) => sum + d.points, 0);
    if (firstHalf === 0 && secondHalf > 0) return "+100%";
    if (firstHalf === 0 && secondHalf === 0) return "0.0%";
    const diff = ((secondHalf - firstHalf) / Math.max(1, firstHalf)) * 100;
    return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
  }, [trendData]);

  // Real category breakdown from tasks
  const categoryMix = useMemo(() => {
    const catMap = new Map<string, { count: number; points: number }>();
    mine.forEach((t) => {
      const rec = t as unknown as Record<string, unknown>;
      const tType = String(rec.type || rec.kind || "");
      const catLabel = getCategoryLabel(t.category);
      const cat =
        catLabel !== "Uncategorized"
          ? catLabel
          : tType === "project"
            ? "Project Tasks"
            : tType === "universal"
              ? "General Tasks"
              : "Direct Tasks";
      const pt =
        typeof t.points === "number"
          ? t.points
          : typeof rec.rewardPoints === "number"
            ? (rec.rewardPoints as number)
            : 0;
      const curr = catMap.get(cat) || { count: 0, points: 0 };
      catMap.set(cat, { count: curr.count + 1, points: curr.points + pt });
    });

    const colors = [
      "oklch(0.72 0.19 45)",
      "oklch(0.68 0.16 265)",
      "oklch(0.72 0.16 165)",
      "oklch(0.78 0.16 85)",
      "oklch(0.65 0.2 330)",
    ];

    if (catMap.size === 0) {
      return [
        {
          name: "Assigned Tasks",
          value: Math.max(1, mine.length),
          points: totalPoints || 0,
          color: colors[0],
        },
      ];
    }

    return Array.from(catMap.entries()).map(([name, val], idx) => ({
      name,
      value: val.count,
      points: val.points,
      color: colors[idx % colors.length],
    }));
  }, [mine, totalPoints]);

  // Quality & Efficiency
  const approvalRate = useMemo(() => {
    const totalReviewed = completed.length + rejectedTasks.length;
    if (totalReviewed === 0) return 100;
    return Number(((completed.length / totalReviewed) * 100).toFixed(1));
  }, [completed.length, rejectedTasks.length]);

  const onTimeStats = useMemo(() => {
    if (completed.length === 0) return { count: 0, rate: 100 };
    const onTimeCount = completed.filter((t) => {
      if (!t.dueDate) return true;
      const finish = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;
      const deadline = new Date(t.dueDate).getTime();
      return finish <= deadline;
    }).length;
    const rate = Math.round((onTimeCount / completed.length) * 100);
    return { count: onTimeCount, rate };
  }, [completed]);

  const qualityScore = useMemo(() => {
    if (completed.length === 0) return "5.0";
    const score = (approvalRate * 0.6 + onTimeStats.rate * 0.4) / 20;
    return Math.min(5.0, Math.max(1.0, score)).toFixed(1);
  }, [completed.length, approvalRate, onTimeStats.rate]);

  const bonusMultiplier = useMemo(() => {
    if (completed.length === 0) return "1.00×";
    const bonus = 1 + Math.min(0.5, activeStreak * 0.02 + completed.length * 0.01);
    return `${bonus.toFixed(2)}×`;
  }, [completed.length, activeStreak]);

  // Skills radar
  const skillsRadar = useMemo(() => {
    const speedScore =
      turnaroundDays <= 1 ? 95 : turnaroundDays <= 2 ? 88 : turnaroundDays <= 3 ? 78 : 65;
    const qualityScorePct = Math.round(approvalRate);
    const onTimeScore = onTimeStats.rate;
    const consistencyScore = Math.min(100, Math.max(50, activeStreak * 10 + 50));
    const volumeScore = Math.min(100, Math.max(40, completed.length * 15 + 40));
    const initiativeScore = Math.min(100, Math.max(60, mine.length * 10 + 60));

    return [
      { skill: "Speed", score: speedScore, fullMark: 100 },
      { skill: "Quality", score: qualityScorePct, fullMark: 100 },
      { skill: "Accuracy", score: onTimeScore, fullMark: 100 },
      { skill: "Volume", score: volumeScore, fullMark: 100 },
      { skill: "Consistency", score: consistencyScore, fullMark: 100 },
      { skill: "Initiative", score: initiativeScore, fullMark: 100 },
    ];
  }, [turnaroundDays, approvalRate, onTimeStats.rate, activeStreak, completed.length, mine.length]);

  const overallMastery = useMemo(() => {
    const total = skillsRadar.reduce((sum, s) => sum + s.score, 0);
    return (total / skillsRadar.length).toFixed(1);
  }, [skillsRadar]);

  // Month-over-month trajectory (real 4-month dynamic data)
  const monthlyComparison = useMemo(() => {
    const now = new Date();
    return [3, 2, 1, 0].map((mOffset) => {
      const d = new Date(now.getFullYear(), now.getMonth() - mOffset, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthName = d.toLocaleDateString(undefined, { month: "short" });

      const mTasks = mine.filter((t) => {
        const isDone = t.status === "completed" || (t.status as string) === "Completed";
        if (!isDone) return false;
        const taskDate = t.updatedAt
          ? new Date(t.updatedAt)
          : t.dueDate
            ? new Date(t.dueDate)
            : t.createdAt
              ? new Date(t.createdAt)
              : null;
        return taskDate ? taskDate >= monthStart && taskDate <= monthEnd : false;
      });

      const pts = mTasks.reduce((sum, t) => {
        const rec = t as unknown as Record<string, unknown>;
        return (
          sum +
          (typeof t.points === "number"
            ? t.points
            : typeof rec.rewardPoints === "number"
              ? (rec.rewardPoints as number)
              : 0)
        );
      }, 0);

      const finalPoints =
        mOffset === 0 && pts === 0 && analytics?.monthlyPerformance?.totalPoints
          ? analytics.monthlyPerformance.totalPoints
          : pts;
      const finalCompleted =
        mOffset === 0 && mTasks.length === 0 ? completed.length : mTasks.length;

      return {
        month: monthName,
        completed: finalCompleted,
        points: finalPoints,
      };
    });
  }, [mine, analytics?.monthlyPerformance, completed.length]);

  // Dynamic achievement badges based on actual accomplishments
  const achievements = useMemo(() => {
    return [
      {
        icon: Trophy,
        title: "Point Starter",
        desc: "Earned your first 50+ points in the platform",
        unlocked: totalPoints >= 50,
        date: totalPoints >= 50 ? "Unlocked" : "Locked (50 pts required)",
        accent: totalPoints >= 50 ? "text-warning bg-warning/15 border-warning/30" : "text-muted-foreground bg-muted/20 border-border/40",
      },
      {
        icon: Zap,
        title: "Task Crusher",
        desc: "Successfully completed assigned tasks",
        unlocked: completed.length >= 1,
        date: completed.length >= 1 ? `${completed.length} tasks completed` : "Locked (1 task required)",
        accent: completed.length >= 1 ? "text-primary bg-primary/15 border-primary/30" : "text-muted-foreground bg-muted/20 border-border/40",
      },
      {
        icon: Target,
        title: "On-Time Achiever",
        desc: "Maintained 90%+ on-time delivery rate",
        unlocked: completed.length >= 1 && onTimeStats.rate >= 90,
        date: completed.length >= 1 && onTimeStats.rate >= 90 ? `${onTimeStats.rate}% on-time` : "Locked",
        accent: completed.length >= 1 && onTimeStats.rate >= 90 ? "text-success bg-success/15 border-success/30" : "text-muted-foreground bg-muted/20 border-border/40",
      },
      {
        icon: Flame,
        title: "Consistency Champion",
        desc: "Maintained an active continuous streak",
        unlocked: activeStreak >= 1,
        date: activeStreak >= 1 ? `${activeStreak}-day active streak` : "Locked",
        accent: activeStreak >= 1 ? "text-warning bg-warning/15 border-warning/30" : "text-muted-foreground bg-muted/20 border-border/40",
      },
    ];
  }, [totalPoints, completed.length, onTimeStats.rate, activeStreak]);

  const unlockedCount = useMemo(() => achievements.filter((a) => a.unlocked).length, [achievements]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header with Time Range Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Statistics"
          subtitle="Your personal performance, points, and trends."
        />
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as "7d" | "30d" | "90d")}>
            <SelectTrigger className="w-[160px] rounded-full border-border/60 bg-card/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top KPIs Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total points earned"
          value={totalPoints > 0 ? totalPoints.toLocaleString() : "0"}
          icon={Sparkles}
          accent="primary"
          hint="Organization ranking points"
        />
        <StatCard
          label="Tasks completed"
          value={`${completed.length}`}
          icon={CheckCircle2}
          accent="success"
          hint={inReview.length > 0 ? `${inReview.length} in review right now` : `${mine.length - completed.length} remaining`}
        />
        <StatCard
          label="Avg. turnaround"
          value={turnaroundDays > 0 ? `${turnaroundDays} d` : completed.length > 0 ? "Same day" : "—"}
          icon={Clock}
          accent="info"
          hint={turnaroundDays > 0 && turnaroundDays <= 2 ? "Fast completion rate" : completed.length > 0 ? "Standard rate" : "No completed tasks yet"}
        />
        <StatCard
          label="Active streak"
          value={`${activeStreak} ${activeStreak === 1 ? "day" : "days"}`}
          icon={Flame}
          accent="warning"
          hint={activeStreak > 0 ? `${activeStreak} day active streak` : "Complete tasks to build streak"}
        />
      </div>

      {/* Monthly Performance & Goal Progress Section (employee-dashboard/analytics) */}
      <div className="glass grid gap-4 rounded-2xl p-5 sm:grid-cols-2 lg:grid-cols-4 border border-border/60">
        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Target className="h-3.5 w-3.5 text-primary" /> Monthly Points Goal
            </span>
            <span className="text-xs font-semibold text-primary">{monthlyStats.progressPct}%</span>
          </div>
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-lg font-bold text-foreground">
              {monthlyStats.pointsEarned.toLocaleString()}{" "}
              <span className="text-xs font-normal text-muted-foreground">/ {monthlyStats.pointsGoal.toLocaleString()} pts</span>
            </span>
          </div>
          <Progress value={monthlyStats.progressPct} className="h-2 bg-secondary" />
          <p className="text-[11px] text-muted-foreground">
            {monthlyStats.remainingPoints > 0
              ? `${monthlyStats.remainingPoints.toLocaleString()} pts needed to reach goal`
              : "🎉 Monthly goal achieved!"}
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-border/40 bg-card/20 p-3.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-info" /> Daily Avg Velocity
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-foreground">{monthlyStats.avgPerDay}</span>
            <span className="text-xs text-muted-foreground">pts / day</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Average points per day this month</p>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-border/40 bg-card/20 p-3.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-warning" /> Peak Best Day
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-foreground">{monthlyStats.bestDay}</span>
            <span className="text-xs text-muted-foreground">pts</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Single day highest output record</p>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-border/40 bg-card/20 p-3.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-success" /> Weekly Cadence
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-foreground">{monthlyStats.tasksPerWeek}</span>
            <span className="text-xs text-muted-foreground">tasks / wk</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Estimated weekly task completion rate</p>
        </div>
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Output & Points Velocity */}
        <div className="glass flex flex-col justify-between rounded-2xl p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-semibold">Points velocity & output</h3>
              <p className="text-xs text-muted-foreground">
                {timeRange === "7d"
                  ? "Points earned, tasks completed, and planned work this week"
                  : timeRange === "90d"
                    ? "Rolling 12-week points velocity"
                    : "Points and task output over the last 4 weeks"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                <TrendingUp className="mr-1 h-3 w-3" /> {velocityChange} vs prev period
              </Badge>
            </div>
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="ptsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey={xKey} {...axisStyle} tickLine={false} axisLine={false} />
                <YAxis {...axisStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area
                  name="Points earned"
                  type="monotone"
                  dataKey="points"
                  stroke={ACCENT}
                  strokeWidth={2.5}
                  fill="url(#ptsGrad)"
                />
                <Line
                  name="Tasks completed"
                  type="monotone"
                  dataKey="tasks"
                  stroke="oklch(0.68 0.16 265)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "oklch(0.68 0.16 265)" }}
                />
                {timeRange === "7d" && (
                  <Line
                    name="Tasks planned"
                    type="monotone"
                    dataKey="planned"
                    stroke="oklch(0.78 0.16 85)"
                    strokeWidth={1.75}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: "oklch(0.78 0.16 85)" }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Category Distribution */}
        <div className="glass flex flex-col justify-between rounded-2xl p-5">
          <div>
            <h3 className="font-display text-base font-semibold">Category breakdown</h3>
            <p className="text-xs text-muted-foreground">Volume & points distribution</p>
          </div>

          <div className="mt-2 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryMix}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  stroke="none"
                >
                  {categoryMix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || chartColorAt(index)} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-3 divide-y divide-border/40 text-xs">
            {categoryMix.map((item, idx) => (
              <li key={item.name} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color || chartColorAt(idx) }}
                  />
                  <span className="font-medium text-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{item.value} {item.value === 1 ? "task" : "tasks"}</span>
                  <span className="font-semibold text-primary">{item.points} pts</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quality & Efficiency Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Approval Rate</span>
            <span className="font-semibold text-success">{approvalRate}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${approvalRate}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {completed.length} of {completed.length + rejectedTasks.length} approved
          </p>
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>On-Time Delivery</span>
            <span className="font-semibold text-primary">{onTimeStats.rate}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${onTimeStats.rate}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {onTimeStats.count} tasks delivered before deadline
          </p>
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Quality Score</span>
            <span className="font-semibold text-warning">{qualityScore} / 5.0</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-warning transition-all"
              style={{ width: `${Math.min(100, Math.round((Number(qualityScore) / 5.0) * 100))}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Based on task completions & reviews</p>
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Bonus Multiplier</span>
            <span className="font-semibold text-info">{bonusMultiplier}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-info transition-all"
              style={{ width: `${Math.min(100, Math.round(parseFloat(bonusMultiplier) * 70))}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Active streak & performance tier</p>
        </div>
      </div>

      {/* Skills Radar & Monthly Comparison */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Skill Proficiency Radar */}
        <div className="glass flex flex-col justify-between rounded-2xl p-5">
          <div>
            <h3 className="font-display text-base font-semibold">Skill competencies</h3>
            <p className="text-xs text-muted-foreground">Dynamic performance dimensions</p>
          </div>

          <div className="mt-2 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skillsRadar}>
                <PolarGrid stroke={GRID_STROKE} />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "oklch(0.7 0 0)", fontSize: 11 }} />
                <PolarRadiusAxis stroke={GRID_STROKE} tick={false} axisLine={false} />
                <Radar
                  name="Proficiency"
                  dataKey="score"
                  stroke={ACCENT}
                  fill={ACCENT}
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Overall Mastery</span>
            <span className="font-semibold text-primary">{overallMastery} / 100</span>
          </div>
        </div>

        {/* Month-over-Month Growth */}
        <div className="glass flex flex-col justify-between rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold">Month-over-month trajectory</h3>
              <p className="text-xs text-muted-foreground">Historical completion count & total reward points</p>
            </div>
            <Badge variant="outline" className="border-border/60">
              Last 4 months
            </Badge>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparison}>
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" {...axisStyle} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" {...axisStyle} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" {...axisStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="completed" name="Tasks completed" fill="oklch(0.68 0.16 265)" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="points" name="Points earned" fill={ACCENT} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Badges & Milestones Showcase */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold">Earned milestones</h3>
            <p className="text-xs text-muted-foreground">Recognition badges for exceptional performance</p>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            <Star className="mr-1 h-3 w-3" /> {unlockedCount} of {achievements.length} unlocked
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {achievements.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.title}
                className={cn(
                  "group relative flex flex-col justify-between rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-glow",
                  a.unlocked
                    ? "border-border/60 bg-card/40 hover:border-primary/40"
                    : "border-border/30 bg-card/20 opacity-60"
                )}
              >
                <div>
                  <div className={cn("grid h-10 w-10 place-items-center rounded-xl border", a.accent)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-3 text-sm font-semibold text-foreground">{a.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{a.desc}</p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
                  <span className={a.unlocked ? "text-primary font-medium" : "text-muted-foreground"}>{a.date}</span>
                  <Award className={cn("h-3.5 w-3.5", a.unlocked ? "text-primary opacity-80 group-hover:opacity-100" : "text-muted-foreground/40")} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
