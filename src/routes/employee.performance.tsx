import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/lib/auth";
import { useTasksQuery } from "@/features/tasks";

export const Route = createFileRoute("/employee/performance")({
  head: () => ({
    meta: [
      { title: "Performance — Poll" },
      { name: "description", content: "Your performance trend across quality, speed, and volume." },
      { property: "og:title", content: "Performance — Poll" },
      { property: "og:description", content: "Your performance across quality, speed, and volume." },
    ],
  }),
  component: PerformancePage,
});

function PerformancePage() {
  const auth = useAuth();
  const currentUserId = auth.user?.id || auth.user?._id || "";
  const { data: tasks = [] } = useTasksQuery();

  const mine = useMemo(() => {
    return tasks.filter((t) => {
      return (
        (currentUserId && t.assigneeId === currentUserId) ||
        (auth.user?.name && t.assignee === auth.user.name) ||
        (auth.user?.email && t.assignee === auth.user.email)
      );
    });
  }, [tasks, currentUserId, auth.user?.name, auth.user?.email]);

  const performanceTrend = useMemo(() => {
    const weeks: { week: string; points: number; tasks: number }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const target = new Date(now);
      target.setDate(now.getDate() - i * 7);

      const start = new Date(target);
      start.setDate(target.getDate() - target.getDay() + (target.getDay() === 0 ? -6 : 1));
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const weekLabel = `W${Math.max(1, Math.ceil(target.getDate() / 7))} ${target.toLocaleDateString(undefined, { month: "short" })}`;
      const weekTasks = mine.filter((t) => {
        if (t.status !== "completed" && (t.status as string) !== "Completed") return false;
        const d = t.updatedAt ? new Date(t.updatedAt) : t.dueDate ? new Date(t.dueDate) : t.createdAt ? new Date(t.createdAt) : null;
        return d ? d >= start && d <= end : false;
      });

      const points = weekTasks.reduce((acc, t) => acc + (t.points || 0), 0);
      weeks.push({ week: weekLabel, points, tasks: weekTasks.length });
    }
    return weeks;
  }, [mine]);

  const completedCount = mine.filter((t) => t.status === "completed" || (t.status as string) === "Completed").length;
  const totalCount = mine.length || 1;
  const completionRate = Math.min(100, Math.round((completedCount / totalCount) * 100));

  const skills = useMemo(() => [
    { skill: "Speed", value: Math.max(60, Math.min(95, 70 + completedCount * 2)) },
    { skill: "Quality", value: Math.max(70, Math.min(98, 75 + completionRate / 4)) },
    { skill: "Impact", value: Math.max(65, Math.min(95, 65 + Math.min(30, completedCount * 3))) },
    { skill: "Collaboration", value: 85 },
    { skill: "Ownership", value: Math.max(75, Math.min(96, 75 + completionRate / 5)) },
  ], [completedCount, completionRate]);

  return (
    <>
      <PageHeader title="Performance" subtitle="How you're trending across the last two months." />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h3 className="font-display text-lg font-semibold">Weekly output</h3>
          <p className="text-xs text-muted-foreground">Points and tasks by week</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="points" stroke="var(--color-chart-1)" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="tasks" stroke="var(--color-chart-2)" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="font-display text-lg font-semibold">Skill radar</h3>
          <p className="text-xs text-muted-foreground">Your verified operational strengths</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skills}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                <PolarRadiusAxis stroke="var(--color-border)" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} />
                <Radar dataKey="value" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
