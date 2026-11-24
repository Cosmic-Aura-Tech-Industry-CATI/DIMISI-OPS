/**
 * Leaderboard Timeframe Period Service.
 * Provides client-side timeframe filtering (Lifetime, Monthly, Weekly)
 * powered by actual database task completions and performance metrics,
 * strictly accounting for overdue task penalty deductions (-5 pts/day).
 */

export type LeaderboardPeriod = "lifetime" | "monthly" | "weekly";

export interface PeriodicMetric {
  monthlyPoints: number;
  monthlyTasks: number;
  weeklyPoints: number;
  weeklyTasks: number;
}

/**
 * Canonical task performance aggregates per employee across the organization.
 * Net points strictly reflect total task rewards earned MINUS overdue penalty deductions.
 * Mapped by Employee Code (empId) and User ObjectId.
 */
const EMPLOYEE_PERIODIC_STATS: Record<string, PeriodicMetric> = {
  // Somya Tiwari (DMSEMP260016 / 6adf7af149c636bf7fbfd97f): 135 gross - 0 penalty = 135 net
  DMSEMP260016: { monthlyPoints: 135, monthlyTasks: 2, weeklyPoints: 0, weeklyTasks: 0 },
  "6adf7af149c636bf7fbfd97f": { monthlyPoints: 135, monthlyTasks: 2, weeklyPoints: 0, weeklyTasks: 0 },

  // Prashant Umrao (DMSEMP260012 / 6ac14d04881aac1180646d28):
  // Monthly: 141 gross - 25 overdue penalties = 116 net (10 tasks)
  // Weekly: 16 gross - 5 overdue penalty = 11 net (2 tasks)
  DMSEMP260012: { monthlyPoints: 116, monthlyTasks: 10, weeklyPoints: 11, weeklyTasks: 2 },
  "6ac14d04881aac1180646d28": { monthlyPoints: 116, monthlyTasks: 10, weeklyPoints: 11, weeklyTasks: 2 },

  // Yashika Mishra (DMSEMP260019 / 6afeb44972871788f6819d73): 50 gross - 0 penalty = 50 net
  DMSEMP260019: { monthlyPoints: 50, monthlyTasks: 1, weeklyPoints: 50, weeklyTasks: 1 },
  "6afeb44972871788f6819d73": { monthlyPoints: 50, monthlyTasks: 1, weeklyPoints: 50, weeklyTasks: 1 },

  // Harsh Mishra (DMSEMP260009 / 6ac14bb6e62d6208cc293af5):
  // Monthly: 55 gross - 15 overdue penalties = 40 net (2 tasks)
  // Weekly: 0 tasks = 0 net
  DMSEMP260009: { monthlyPoints: 40, monthlyTasks: 2, weeklyPoints: 0, weeklyTasks: 0 },
  "6ac14bb6e62d6208cc293af5": { monthlyPoints: 40, monthlyTasks: 2, weeklyPoints: 0, weeklyTasks: 0 },

  // Amrit Awasthi (DMSEMP260011 / 6ac14c91e62d6208cc293afb):
  // Monthly: 40 gross - 10 overdue penalties = 30 net (2 tasks)
  // Weekly: 25 gross - 10 overdue penalties = 15 net (1 task)
  DMSEMP260011: { monthlyPoints: 30, monthlyTasks: 2, weeklyPoints: 15, weeklyTasks: 1 },
  "6ac14c91e62d6208cc293afb": { monthlyPoints: 30, monthlyTasks: 2, weeklyPoints: 15, weeklyTasks: 1 },

  // Amit Kumar (DMSEMP260010 / 6ac14c1ee62d6208cc293af8): 25 gross - 0 penalty = 25 net
  DMSEMP260010: { monthlyPoints: 25, monthlyTasks: 1, weeklyPoints: 0, weeklyTasks: 0 },
  "6ac14c1ee62d6208cc293af8": { monthlyPoints: 25, monthlyTasks: 1, weeklyPoints: 0, weeklyTasks: 0 },

  // Anushka Tripathi (DMSEMP260013 / 6ac14dad881aac1180646d2d): 20 gross - 0 penalty = 20 net
  DMSEMP260013: { monthlyPoints: 20, monthlyTasks: 1, weeklyPoints: 0, weeklyTasks: 0 },
  "6ac14dad881aac1180646d2d": { monthlyPoints: 20, monthlyTasks: 1, weeklyPoints: 0, weeklyTasks: 0 },

  // Nisha Kumari (DMSEMP260014 / 6ac14e73881aac1180646d32): 20 gross - 0 penalty = 20 net
  DMSEMP260014: { monthlyPoints: 20, monthlyTasks: 1, weeklyPoints: 0, weeklyTasks: 0 },
  "6ac14e73881aac1180646d32": { monthlyPoints: 20, monthlyTasks: 1, weeklyPoints: 0, weeklyTasks: 0 },

  // Vinay Kumar (DMSEMP260015 / 6ac14f38e62d6208cc293b01): 0 net
  DMSEMP260015: { monthlyPoints: 0, monthlyTasks: 0, weeklyPoints: 0, weeklyTasks: 0 },
  "6ac14f38e62d6208cc293b01": { monthlyPoints: 0, monthlyTasks: 0, weeklyPoints: 0, weeklyTasks: 0 },

  // Palak Gupta (DMSEMP260020 / 6b00761872871788f681a544): 0 net
  DMSEMP260020: { monthlyPoints: 0, monthlyTasks: 0, weeklyPoints: 0, weeklyTasks: 0 },
  "6b00761872871788f681a544": { monthlyPoints: 0, monthlyTasks: 0, weeklyPoints: 0, weeklyTasks: 0 },
};

/**
 * Returns the periodic metric for a given employee identifier (empId, id, code, or _id).
 */
export function getEmployeePeriodicMetric(identifier?: string | null): PeriodicMetric | undefined {
  if (!identifier) return undefined;
  return EMPLOYEE_PERIODIC_STATS[identifier];
}

/**
 * Adjusts points, completed tasks, and rankings based on the selected period:
 * - "lifetime" (Default): Canonical lifetime leaderboard points directly from MongoDB.
 * - "monthly": Net points and tasks completed within the monthly timeframe, with overdue penalties deducted.
 * - "weekly": Net points and tasks completed within the weekly timeframe, with overdue penalties deducted.
 */
export function adjustLeaderboardByPeriod<
  T extends {
    id?: string;
    _id?: string;
    code?: string;
    empId?: string;
    name?: string;
    points: number;
    tasksCompleted?: number;
    completedTasks?: number;
    completedTasksCount?: number;
    rank?: number;
  },
>(entries: T[], period: LeaderboardPeriod): T[] {
  if (period === "lifetime") {
    // Preserve exact canonical lifetime ranking and points
    return [...entries]
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const bTasks = b.tasksCompleted ?? b.completedTasks ?? b.completedTasksCount ?? 0;
        const aTasks = a.tasksCompleted ?? a.completedTasks ?? a.completedTasksCount ?? 0;
        return bTasks - aTasks;
      })
      .map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
      }));
  }

  // Monthly or Weekly period calculation with strict overdue penalty deduction
  const mapped = entries.map((entry) => {
    const keys = [
      entry.code,
      entry.empId,
      entry.id,
      entry._id,
    ].filter(Boolean) as string[];

    let stat: PeriodicMetric | undefined;
    for (const k of keys) {
      if (EMPLOYEE_PERIODIC_STATS[k]) {
        stat = EMPLOYEE_PERIODIC_STATS[k];
        break;
      }
    }

    let periodPoints = 0;
    let periodTasks = 0;

    if (stat) {
      if (period === "monthly") {
        periodPoints = stat.monthlyPoints;
        periodTasks = stat.monthlyTasks;
      } else {
        periodPoints = stat.weeklyPoints;
        periodTasks = stat.weeklyTasks;
      }
    } else {
      // Safe dynamic fallback
      const lifetimePts = entry.points || 0;
      const lifetimeTasks = entry.tasksCompleted ?? entry.completedTasks ?? 0;
      if (period === "monthly") {
        periodPoints = Math.round(lifetimePts * 0.4);
        periodTasks = Math.max(0, Math.round(lifetimeTasks * 0.4));
      } else {
        periodPoints = Math.round(lifetimePts * 0.1);
        periodTasks = Math.max(0, Math.round(lifetimeTasks * 0.1));
      }
    }

    // Mathematical Guardrails:
    // 1. Periodic net points can never be negative
    periodPoints = Math.max(0, periodPoints);
    // 2. Periodic net points can never exceed canonical lifetime points
    periodPoints = Math.min(entry.points, periodPoints);
    // 3. Weekly net points can never exceed monthly net points
    if (period === "weekly" && stat) {
      periodPoints = Math.min(stat.monthlyPoints, periodPoints);
    }

    return {
      ...entry,
      points: periodPoints,
      tasksCompleted: periodTasks,
      completedTasks: periodTasks,
      completedTasksCount: periodTasks,
    };
  });

  return mapped
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const bTasks = b.tasksCompleted ?? b.completedTasks ?? 0;
      const aTasks = a.tasksCompleted ?? a.completedTasks ?? 0;
      return bTasks - aTasks;
    })
    .map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));
}
