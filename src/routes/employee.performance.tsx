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
import { performanceTrend } from "@/lib/mock-data";

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

const skills = [
  { skill: "Speed", value: 88 },
  { skill: "Quality", value: 92 },
  { skill: "Impact", value: 76 },
  { skill: "Collaboration", value: 84 },
  { skill: "Ownership", value: 90 },
];

function PerformancePage() {
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
          <p className="text-xs text-muted-foreground">Your peer-reviewed strengths</p>
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
