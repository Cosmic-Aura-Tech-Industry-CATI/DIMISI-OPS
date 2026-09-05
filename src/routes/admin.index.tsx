import { useMemo } from "react";
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
import { useDashboardOverviewQuery } from "@/features/dashboard";
import { useLeaderboardQuery } from "@/features/leaderboard/hooks/use-leaderboard-api";
import { useEmployeesQuery } from "@/features/employees/hooks/use-employees-api";
import { useTasksQuery } from "@/features/tasks/hooks/use-tasks-api";
import { useNoticesQuery } from "@/features/notices/hooks/use-notices-api";
import { useAdminsQuery } from "@/features/admins/hooks/use-admins-api";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { data: dashboard, isLoading: isDashboardLoading } = useDashboardOverviewQuery();
  const { data: leaderboardData } = useLeaderboardQuery(5);
  const { data: employeesData } = useEmployeesQuery({ page: 1 });
  const { data: adminsData } = useAdminsQuery();
  const { data: allTasks } = useTasksQuery();
  const { data: notices } = useNoticesQuery();

  const employeesList = useMemo(() => employeesData?.employees || [], [employeesData]);
  const tasksList = useMemo(() => allTasks || [], [allTasks]);
  const adminsList = useMemo(() => adminsData?.admins || [], [adminsData]);

  // Derived metrics from live collections (used if dashboard aggregate is 0 or loading)
  const derivedActiveTasks = useMemo(
    () => tasksList.filter((t) => t.status !== "completed").length,
    [tasksList],
  );
  const derivedPendingReviews = useMemo(
    () => tasksList.filter((t) => t.reviewState === "in_review" || (t as any).rawStatus === "In Review").length,
    [tasksList],
  );
  const derivedCompletedTasks = useMemo(
    () => tasksList.filter((t) => t.status === "completed").length,
    [tasksList],
  );
  const derivedTotalPoints = useMemo(
    () => employeesList.reduce((acc, e) => acc + (Number(e.points) || 0), 0),
    [employeesList],
  );

  // Top KPIs: prioritize backend dashboard aggregate, fallback to live collection length
  const totalEmployees = dashboard?.kpis?.totalEmployees?.current || employeesList.length;
  const employeesTrend = dashboard?.kpis?.totalEmployees?.trend ?? 0;

  const totalAdmins = dashboard?.kpis?.totalAdmins?.current || adminsList.length;
  const adminsTrend = dashboard?.kpis?.totalAdmins?.trend ?? 0;

  const activeTasks = dashboard?.kpis?.activeTasks?.current || derivedActiveTasks;
  const activeTasksTrend = dashboard?.kpis?.activeTasks?.trend ?? 0;

  const pendingReviews = dashboard?.kpis?.pendingReviews?.current || derivedPendingReviews;
  const pendingReviewsTrend = dashboard?.kpis?.pendingReviews?.trend ?? 0;

  const completedTasks = dashboard?.kpis?.completedTasks?.current || derivedCompletedTasks;
  const completedTasksTrend = dashboard?.kpis?.completedTasks?.trend ?? 0;

  const totalPoints = dashboard?.kpis?.totalRewardPoints?.current || derivedTotalPoints;
  const totalPointsTrend = dashboard?.kpis?.totalRewardPoints?.trend ?? 0;

  // Real upcoming deadlines from live Tasks collection
  const upcomingTasks = useMemo(() => {
    if (tasksList.length === 0) return [];
    return [...tasksList]
      .filter((t) => t.status !== "completed")
      .sort((a, b) => {
        const dateA = a.dueDate || "";
        const dateB = b.dueDate || "";
        if (!dateA) return 1;
        if (!dateB) return -1;
        return +new Date(dateA) - +new Date(dateB);
      })
      .slice(0, 5);
  }, [tasksList]);

  // Real recent announcements / activity from live Notices collection
  const recentActivityItems = useMemo(() => {
    if (!notices || notices.length === 0) return [];
    return notices.slice(0, 5).map((n) => {
      const creatorName =
        typeof n.created_by === "object" && n.created_by !== null
          ? (n.created_by as any).name || (n.created_by as any).email || "Admin"
          : typeof n.created_by === "string" && n.created_by.trim()
            ? n.created_by
            : "Admin";

      return {
        id: String(n.id || (n as any)._id || Math.random()),
        user: creatorName,
        userAvatar: "AD",
        action: "posted notice",
        target: String(n.title || "Announcement"),
        timestamp: String(n.createdAt || n.published_at || new Date().toISOString()),
      };
    });
  }, [notices]);

  // Real latest 5 registered employees
  const latestEmployees = useMemo(() => {
    return employeesList.slice(0, 5);
  }, [employeesList]);

  // Real top 5 leaderboard earners
  const topFiveLeaderboard = useMemo(() => {
    return (leaderboardData || []).slice(0, 5);
  }, [leaderboardData]);

  // Dynamic Task Completion Chart from live tasks if backend is empty
  const taskCompletionData = useMemo(() => {
    if (dashboard?.taskCompletion && dashboard.taskCompletion.length > 0) {
      return dashboard.taskCompletion;
    }
    const daysMap: Record<string, { created: number; completed: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayStr = d.toLocaleDateString("en-US", { weekday: "short" });
      daysMap[dayStr] = { created: 0, completed: 0 };
    }
    tasksList.forEach((t) => {
      const d = new Date(t.createdAt || t.dueDate || Date.now());
      const dayStr = d.toLocaleDateString("en-US", { weekday: "short" });
      if (daysMap[dayStr]) {
        daysMap[dayStr].created += 1;
        if (t.status === "completed") daysMap[dayStr].completed += 1;
      }
    });
    return Object.entries(daysMap).map(([day, val]) => ({
      day,
      created: val.created,
      completed: val.completed,
    }));
  }, [dashboard?.taskCompletion, tasksList]);

  // Dynamic Points Distribution Chart from live employees
  const pointsDistributionData = useMemo(() => {
    if (dashboard?.pointsDistribution && dashboard.pointsDistribution.length > 0) {
      return dashboard.pointsDistribution;
    }
    const buckets = [
      { range: "0-500", count: 0 },
      { range: "500-1k", count: 0 },
      { range: "1k-1.5k", count: 0 },
      { range: "1.5k-2k", count: 0 },
      { range: "2k+", count: 0 },
    ];
    employeesList.forEach((e) => {
      const pts = Number(e.points) || 0;
      if (pts < 500) buckets[0].count += 1;
      else if (pts < 1000) buckets[1].count += 1;
      else if (pts < 1500) buckets[2].count += 1;
      else if (pts < 2000) buckets[3].count += 1;
      else buckets[4].count += 1;
    });
    return buckets;
  }, [dashboard?.pointsDistribution, employeesList]);

  // Dynamic Task Distribution by Department
  const taskDistributionData = useMemo(() => {
    if (dashboard?.taskDistribution && dashboard.taskDistribution.length > 0) {
      return dashboard.taskDistribution.map((d) => ({
        department:
          typeof d.department === "object" && d.department !== null
            ? (d.department as any).name || "General"
            : String(d.department || "General"),
        count: Number(d.count || 0),
      }));
    }
    const deptMap: Record<string, number> = {};
    tasksList.forEach((t) => {
      const dept =
        typeof t.category === "object" && t.category !== null
          ? (t.category as any).name || "General"
          : String(t.category || "General");
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    return Object.entries(deptMap).map(([department, count]) => ({
      department,
      count,
    }));
  }, [dashboard?.taskDistribution, tasksList]);

  // Dynamic Department Performance
  const departmentPerformanceData = useMemo(() => {
    if (dashboard?.departmentPerformance && dashboard.departmentPerformance.length > 0) {
      return dashboard.departmentPerformance.map((d) => ({
        department:
          typeof d.department === "object" && d.department !== null
            ? (d.department as any).name || "General"
            : String(d.department || "General"),
        tasks: Number(d.tasks || 0),
        completionRate: Number(d.completionRate || 0),
      }));
    }
    const deptMap: Record<string, { total: number; completed: number }> = {};
    tasksList.forEach((t) => {
      const dept =
        typeof t.category === "object" && t.category !== null
          ? (t.category as any).name || "General"
          : String(t.category || "General");
      if (!deptMap[dept]) deptMap[dept] = { total: 0, completed: 0 };
      deptMap[dept].total += 1;
      if (t.status === "completed") deptMap[dept].completed += 1;
    });
    return Object.entries(deptMap).map(([department, stat]) => ({
      department,
      tasks: stat.total,
      completionRate: stat.total > 0 ? Number(((stat.completed / stat.total) * 100).toFixed(1)) : 0,
    }));
  }, [dashboard?.departmentPerformance, tasksList]);

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

      {/* Top stat cards from live backend MongoDB data */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total employees"
          value={totalEmployees}
          icon={Users}
          delta={employeesTrend}
          accent="primary"
        />
        <StatCard
          label="Total admins"
          value={totalAdmins}
          icon={Shield}
          delta={adminsTrend}
          accent="info"
        />
        <StatCard
          label="Active tasks"
          value={activeTasks}
          icon={ListTodo}
          delta={activeTasksTrend}
          accent="info"
        />
        <StatCard
          label="Pending reviews"
          value={pendingReviews}
          icon={ClipboardList}
          delta={pendingReviewsTrend}
          accent="warning"
        />
        <StatCard
          label="Completed tasks"
          value={completedTasks}
          icon={CheckCircle2}
          delta={completedTasksTrend}
          accent="success"
        />
        <StatCard
          label="Total reward points"
          value={totalPoints.toLocaleString()}
          icon={Trophy}
          delta={totalPointsTrend}
          accent="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TaskCompletionChart data={taskCompletionData} />
        <PointsDistributionChart data={pointsDistributionData} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyProductivityChart data={dashboard?.monthlyProductivity} />
        <DepartmentPerformanceList data={departmentPerformanceData} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RecentActivities items={recentActivityItems} />
        <UpcomingDeadlines tasks={upcomingTasks} />
        <LeaderboardPreview entries={topFiveLeaderboard} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <LatestEmployeesTable employees={latestEmployees} />
        <QuickActionsPanel />
      </div>

      <DepartmentDistributionPanel data={taskDistributionData} />
    </>
  );
}



