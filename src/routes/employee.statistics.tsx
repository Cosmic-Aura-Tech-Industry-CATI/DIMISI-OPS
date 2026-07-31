import { createFileRoute } from "@tanstack/react-router";
import { LineChart } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/employee/statistics")({
  head: () => ({
    meta: [
      { title: "Statistics — Poll" },
      { name: "description", content: "Track your task completion, points, and performance trends." },
      { property: "og:title", content: "Statistics — Poll" },
      { property: "og:description", content: "Track your task completion, points, and performance trends." },
    ],
  }),
  component: StatisticsPage,
});

function StatisticsPage() {
  return (
    <>
      <PageHeader title="Statistics" subtitle="Your personal performance, points, and trends." />
      <EmptyState
        icon={LineChart}
        title="Statistics coming soon"
        description="Weekly completion, streaks, points earned, and cycle comparisons will show up here."
      />
    </>
  );
}
