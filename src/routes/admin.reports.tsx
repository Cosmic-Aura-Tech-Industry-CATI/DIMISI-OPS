import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, Trophy, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportsToolbar } from "@/components/reports/reports-toolbar";
import {
  PointsVelocityChart,
  PriorityMixChart,
  TaskStatusMixChart,
  ThroughputTrendChart,
  WeeklyCompletionChart,
} from "@/components/reports/overview-charts";
import { EmployeeReportTab } from "@/components/reports/employee-report-tab";
import { TaskReportTab } from "@/components/reports/task-report-tab";
import { ProjectReportTab } from "@/components/reports/project-report-tab";
import { DepartmentReportTab } from "@/components/reports/department-report-tab";
import { useProjectReport, useReportData } from "@/components/reports/use-report-data";
import { useExportReportMutation, type TimeframeFilter } from "@/features/reports";
import { logAudit } from "@/lib/audit-log";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Dimisi Operations" },
      { name: "description", content: "Deep analytics across employees, tasks, projects, and departments." },
      { property: "og:title", content: "Reports — Dimisi Operations" },
      { property: "og:description", content: "Deep analytics across employees, tasks, projects, and departments." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [range, setRange] = useState("month");
  const [activeTab, setActiveTab] = useState("employee");

  const timeframeMap: Record<string, TimeframeFilter> = {
    week: "weekly",
    month: "monthly",
    quarter: "quarterly",
    year: "yearly",
  };
  const selectedTimeframe = timeframeMap[range] || "monthly";

  const projectReport = useProjectReport(selectedTimeframe);
  const {
    employeeReport,
    taskReport,
    priorityMix,
    departmentReport,
    departmentRadar,
    kpis,
    weeklyCompletionData,
    pointsVelocityData,
    tasksForTab,
  } = useReportData(selectedTimeframe);

  const exportMutation = useExportReportMutation();

  const handleDownload = async (
    formatName: string,
    specificType?: "overview" | "employees" | "tasks" | "projects" | "departments",
  ) => {
    const fmt = formatName.toLowerCase().includes("csv")
      ? "csv"
      : formatName.toLowerCase().includes("excel") || formatName.toLowerCase().includes("xlsx")
        ? "xlsx"
        : formatName.toLowerCase().includes("pdf")
          ? "pdf"
          : "json";

    const type =
      specificType ||
      (activeTab === "employee"
        ? "employees"
        : activeTab === "task"
          ? "tasks"
          : activeTab === "project"
            ? "projects"
            : activeTab === "department"
              ? "departments"
              : "overview");

    try {
      toast.loading(`Generating ${type} report (${fmt.toUpperCase()})...`, {
        id: "report-export",
      });

      const blob = await exportMutation.mutateAsync({
        type,
        format: fmt as any,
        timeframe: selectedTimeframe,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type}_report_${selectedTimeframe}.${fmt === "xlsx" ? "xlsx" : fmt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      logAudit({
        category: "reports",
        action: "Exported Report",
        target: `${type} (${formatName})`,
        details: `${type} report exported as ${formatName}.`,
      });

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded`, {
        id: "report-export",
      });
    } catch (err: any) {
      toast.error("Failed to export report", {
        id: "report-export",
        description: err?.message || "Export service encountered an issue",
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Deep dives across employees, tasks, projects, and departments."
        actions={
          <ReportsToolbar
            range={range}
            onRangeChange={setRange}
            onDownload={(fmt) => handleDownload(fmt)}
          />
        }
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total employees"
          value={kpis.totalEmployees}
          icon={Users}
          delta={kpis.employeesTrend}
          accent="primary"
        />
        <StatCard
          label="Tasks completed"
          value={kpis.totalCompleted}
          icon={CheckCircle2}
          delta={kpis.completedTrend}
          accent="success"
        />
        <StatCard
          label="Avg completion rate"
          value={`${kpis.avgRate}%`}
          icon={TrendingUp}
          delta={5}
          accent="info"
        />
        <StatCard
          label="Total reward points"
          value={kpis.totalPoints.toLocaleString()}
          icon={Trophy}
          delta={kpis.pointsTrend}
          accent="warning"
        />
      </div>

      {/* Overview charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <WeeklyCompletionChart data={weeklyCompletionData} trend={kpis.completedTrend} />
        <TaskStatusMixChart taskReport={taskReport} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <PointsVelocityChart data={pointsVelocityData} />
        <PriorityMixChart data={priorityMix} />
      </div>

      {/* Report tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="employee">Employee Reports</TabsTrigger>
            <TabsTrigger value="task">Task Reports</TabsTrigger>
            <TabsTrigger value="project">Project Reports</TabsTrigger>
            <TabsTrigger value="department">Department Reports</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="employee" className="space-y-4">
          <EmployeeReportTab
            rows={employeeReport}
            onDownload={() => handleDownload("CSV", "employees")}
          />
        </TabsContent>

        <TabsContent value="task" className="space-y-4">
          <TaskReportTab
            buckets={taskReport}
            tasks={tasksForTab}
            onDownload={() => handleDownload("CSV", "tasks")}
          />
        </TabsContent>

        <TabsContent value="project" className="space-y-4">
          <ProjectReportTab
            rows={projectReport}
            onDownload={() => handleDownload("CSV", "projects")}
          />
        </TabsContent>

        <TabsContent value="department" className="space-y-4">
          <DepartmentReportTab
            rows={departmentReport}
            radar={departmentRadar}
            onDownload={() => handleDownload("CSV", "departments")}
          />
        </TabsContent>
      </Tabs>

      <ThroughputTrendChart
        data={weeklyCompletionData.map((w) => ({
          week: w.day,
          tasks: w.completed,
        }))}
      />
    </>
  );
}
