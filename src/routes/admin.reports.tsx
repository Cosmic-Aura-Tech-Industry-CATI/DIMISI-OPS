import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, TrendingUp, Trophy, Users } from "lucide-react";
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
import {
  useExportReportMutation,
  reportsService,
  triggerBlobDownload,
  triggerUrlDownload,
  type ReportEstimateData,
  type TimeframeFilter,
} from "@/features/reports";
import { logAudit } from "@/lib/audit-log";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Dimisi Operations" },
      {
        name: "description",
        content: "Deep analytics across employees, tasks, projects, and departments.",
      },
      { property: "og:title", content: "Reports — Dimisi Operations" },
      {
        property: "og:description",
        content: "Deep analytics across employees, tasks, projects, and departments.",
      },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [range, setRange] = useState("month");
  const [activeTab, setActiveTab] = useState("employee");
  const [isDownloading, setIsDownloading] = useState(false);

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

  const executeSyncDownload = async (
    type: "overview" | "employees" | "tasks" | "projects" | "departments",
    fmt: "csv" | "xlsx" | "pdf" | "json",
    timeframe: TimeframeFilter,
    formatName: string,
    estimate?: ReportEstimateData,
  ) => {
    const estTimeText = estimate?.estimatedSeconds ? ` (~${estimate.estimatedSeconds}s)` : "";
    toast.loading(`Generating ${type} report (${fmt.toUpperCase()}${estTimeText})...`, {
      id: "report-export",
    });

    const blob = await exportMutation.mutateAsync({
      type,
      format: fmt,
      timeframe,
    });

    const fileName = `${type}_report_${timeframe}.${fmt === "xlsx" ? "xlsx" : fmt}`;
    triggerBlobDownload(blob, fileName);

    logAudit({
      category: "reports",
      action: "Exported Report",
      target: `${type} (${formatName})`,
      details: `${type} report exported synchronously as ${formatName}.`,
    });

    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded`, {
      id: "report-export",
    });
  };

  const executeAsyncDownload = async (
    type: "overview" | "employees" | "tasks" | "projects" | "departments",
    fmt: "csv" | "xlsx" | "pdf" | "json",
    timeframe: TimeframeFilter,
    formatName: string,
  ) => {
    toast.loading(`Queueing ${type} report export job (${fmt.toUpperCase()})...`, {
      id: "report-export",
    });

    const job = await reportsService.createDownloadJob(type, fmt, timeframe);
    const jobId = job.jobId || (job as unknown as { data?: { jobId?: string } })?.data?.jobId;

    if (!jobId) {
      throw new Error("Unable to initialize async report download job.");
    }

    toast.loading(`Generating ${type} report in background...`, {
      id: "report-export",
    });

    const result = await reportsService.pollDownloadJob(jobId, (status) => {
      if (status.progress && status.progress > 0) {
        toast.loading(`Generating ${type} report (${status.progress}%)...`, {
          id: "report-export",
        });
      }
    });

    if (result.downloadUrl) {
      const fileName = `${type}_report_${timeframe}.${fmt === "xlsx" ? "xlsx" : fmt}`;
      triggerUrlDownload(result.downloadUrl, fileName);

      logAudit({
        category: "reports",
        action: "Exported Report",
        target: `${type} (${formatName})`,
        details: `${type} report exported asynchronously via queue as ${formatName}.`,
      });

      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} report generated and downloading`,
        {
          id: "report-export",
        },
      );
    }
  };

  const handleDownload = async (
    formatName: string,
    specificType?: "overview" | "employees" | "tasks" | "projects" | "departments",
  ) => {
    if (isDownloading) return;

    const fmt = (
      formatName.toLowerCase().includes("csv")
        ? "csv"
        : formatName.toLowerCase().includes("excel") || formatName.toLowerCase().includes("xlsx")
          ? "xlsx"
          : formatName.toLowerCase().includes("pdf")
            ? "pdf"
            : "json"
    ) as "csv" | "xlsx" | "pdf" | "json";

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

    setIsDownloading(true);

    try {
      let recommendation: "sync" | "async" = "async";
      let estimateData: ReportEstimateData | undefined;

      try {
        const estimate = await reportsService.getEstimate(type, fmt, selectedTimeframe);
        estimateData = estimate;
        const rec =
          (estimate as unknown as { data?: { recommended?: "sync" | "async" } })?.data
            ?.recommended || estimate?.recommended;
        if (rec === "sync" || rec === "async") {
          recommendation = rec;
        }
      } catch {
        recommendation = "async";
      }

      if (recommendation === "sync") {
        await executeSyncDownload(type, fmt, selectedTimeframe, formatName, estimateData);
      } else {
        await executeAsyncDownload(type, fmt, selectedTimeframe, formatName);
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { message?: string })?.message || "Export service encountered an issue";
      toast.error("Failed to export report", {
        id: "report-export",
        description: errorMsg,
      });
    } finally {
      setIsDownloading(false);
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
            disabled={isDownloading}
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
            downloadDisabled={isDownloading}
          />
        </TabsContent>

        <TabsContent value="task" className="space-y-4">
          <TaskReportTab
            buckets={taskReport}
            tasks={tasksForTab}
            onDownload={() => handleDownload("CSV", "tasks")}
            downloadDisabled={isDownloading}
          />
        </TabsContent>

        <TabsContent value="project" className="space-y-4">
          <ProjectReportTab
            rows={projectReport}
            onDownload={() => handleDownload("CSV", "projects")}
            downloadDisabled={isDownloading}
          />
        </TabsContent>

        <TabsContent value="department" className="space-y-4">
          <DepartmentReportTab
            rows={departmentReport}
            radar={departmentRadar}
            onDownload={() => handleDownload("CSV", "departments")}
            downloadDisabled={isDownloading}
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
