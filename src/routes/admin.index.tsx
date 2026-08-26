import { Link, createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  ClipboardList,
  ListTodo,
  Plus,
  Shield,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { getOverviewData } from "@/components/admin-dashboard/dashboard-data";
import {
  DepartmentDistributionPanel,
  DepartmentPerformanceList,
  MonthlyProductivityChart,
  PointsDistributionChart,
  TaskCompletionChart,
} from "@/components/admin-dashboard/overview-charts";
import {
  LatestEmployeesTable,
  LeaderboardPreview,
  RecentActivities,
  UpcomingDeadlines,
} from "@/components/admin-dashboard/dashboard-widgets";
import { QuickActionsPanel } from "@/components/admin-dashboard/quick-actions";
import { admins, employees } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const {
    activeTasks,
    completed,
    pendingReviews,
    totalPoints,
    deadlines,
    latestEmployees,
    topFive,
    recentActivity,
  } = getOverviewData();

  return (
    <>
      <PageHeader
        title="Admin overview"
        subtitle="A pulse on your organization — people, tasks, and momentum."
        actions={
          <>
            <Button variant="outline" className="rounded-md">
              <UserPlus className="mr-1.5 h-4 w-4" /> Invite
            </Button>
            <Button asChild className="rounded-md shadow-glow">
              <Link to="/admin/tasks/new">
                <Plus className="mr-1.5 h-4 w-4" /> New task
              </Link>
            </Button>
          </>
        }
      />

      {/* Top stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total employees" value={employees.length} icon={Users} delta={5.4} accent="primary" />
        <StatCard label="Total admins" value={admins.length} icon={Shield} delta={0} accent="info" />
        <StatCard label="Active tasks" value={activeTasks} icon={ListTodo} delta={3.2} accent="info" />
        <StatCard label="Pending reviews" value={pendingReviews} icon={ClipboardList} delta={-1.8} accent="warning" />
        <StatCard label="Completed tasks" value={completed} icon={CheckCircle2} delta={12.4} accent="success" />
        <StatCard label="Total reward points" value={totalPoints.toLocaleString()} icon={Trophy} delta={8.1} accent="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TaskCompletionChart />
        <PointsDistributionChart />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyProductivityChart />
        <DepartmentPerformanceList />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RecentActivities items={recentActivity} />
        <UpcomingDeadlines tasks={deadlines} />
        <LeaderboardPreview entries={topFive} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <LatestEmployeesTable employees={latestEmployees} />
        <QuickActionsPanel />
      </div>

      <DepartmentDistributionPanel />
    </>
  );
}
