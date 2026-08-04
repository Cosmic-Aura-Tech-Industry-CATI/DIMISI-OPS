import { activityLogs, employees, leaderboard, tasks } from "@/lib/mock-data";

/** Chart palette shared by the admin overview widgets. */
export const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-primary)",
];

export const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
};

export const monthlyProductivity = [
  { month: "Feb", tasks: 68, points: 1420 },
  { month: "Mar", tasks: 82, points: 1680 },
  { month: "Apr", tasks: 74, points: 1520 },
  { month: "May", tasks: 96, points: 1980 },
  { month: "Jun", tasks: 110, points: 2340 },
  { month: "Jul", tasks: 128, points: 2720 },
];

export const departmentPerformance = [
  { name: "Engineering", completion: 88, tasks: 42 },
  { name: "Design", completion: 76, tasks: 24 },
  { name: "Marketing", completion: 64, tasks: 18 },
  { name: "Sales", completion: 82, tasks: 22 },
  { name: "Product", completion: 71, tasks: 16 },
  { name: "Support", completion: 58, tasks: 12 },
];

export const pointsDistribution = [
  { range: "0-500", value: 6 },
  { range: "500-1k", value: 12 },
  { range: "1k-1.5k", value: 18 },
  { range: "1.5k-2k", value: 9 },
  { range: "2k+", value: 4 },
];

/** Derived counters and short lists rendered by the admin overview page. */
export function getOverviewData() {
  return {
    activeTasks: tasks.filter((t) => t.status === "in_progress" || t.status === "pending").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    pendingReviews: tasks.filter((t) => t.status === "completed").length + 3,
    totalPoints: employees.reduce((s, e) => s + e.points, 0),
    deadlines: [...tasks]
      .filter((t) => t.status !== "completed")
      .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
      .slice(0, 5),
    latestEmployees: [...employees]
      .sort((a, b) => +new Date(a.joinedAt) - +new Date(b.joinedAt))
      .slice(0, 5),
    topFive: leaderboard.slice(0, 5),
    recentActivity: activityLogs.slice(0, 6),
  };
}
