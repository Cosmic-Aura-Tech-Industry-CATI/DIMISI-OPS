import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Trophy, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { employees } from "@/lib/mock-data";
import { logAudit } from "@/lib/audit-log";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Poll" },
      { name: "description", content: "Deep analytics across employees, tasks, and departments." },
      { property: "og:title", content: "Reports — Poll" },
      { property: "og:description", content: "Deep analytics across employees, tasks, and departments." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [range, setRange] = useState("month");
  const projectReport = useProjectReport();
  const { employeeReport, taskReport, priorityMix, departmentReport, departmentRadar, kpis } =
    useReportData();

  const download = (label: string) => {
    logAudit({
      category: "reports",
      action: "Exported Report",
      target: label,
      details: `${label} export requested.`,
    });
    toast.success(`${label} export queued`, {
      description: "Your file will download shortly (demo).",
    });
  };

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Deep dives across employees, tasks, and departments."
        actions={<ReportsToolbar range={range} onRangeChange={setRange} onDownload={download} />}
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total employees" value={employees.length} icon={Users} delta={8} />
        <StatCard label="Tasks completed" value={kpis.totalCompleted} icon={CheckCircle2} delta={14} accent="success" />
        <StatCard label="Avg completion rate" value={`${kpis.avgRate}%`} icon={TrendingUp} delta={5} accent="info" />
        <StatCard label="Total reward points" value={kpis.totalPoints.toLocaleString()} icon={Trophy} delta={22} accent="warning" />
      </div>

      {/* Overview charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <WeeklyCompletionChart />
        <TaskStatusMixChart taskReport={taskReport} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <PointsVelocityChart />
        <PriorityMixChart data={priorityMix} />
      </div>

      {/* Report tabs */}
      <Tabs defaultValue="employee" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="employee">Employee Reports</TabsTrigger>
            <TabsTrigger value="task">Task Reports</TabsTrigger>
            <TabsTrigger value="project">Project Reports</TabsTrigger>
            <TabsTrigger value="department">Department Reports</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="employee" className="space-y-4">
          <EmployeeReportTab rows={employeeReport} onDownload={() => download("Employee report")} />
        </TabsContent>

        <TabsContent value="task" className="space-y-4">
          <TaskReportTab buckets={taskReport} onDownload={() => download("Task report")} />
        </TabsContent>

        <TabsContent value="project" className="space-y-4">
          <ProjectReportTab rows={projectReport} onDownload={() => download("Project report")} />
        </TabsContent>

        <TabsContent value="department" className="space-y-4">
          <DepartmentReportTab
            rows={departmentReport}
            radar={departmentRadar}
            onDownload={() => download("Department report")}
          />
        </TabsContent>
      </Tabs>

      <ThroughputTrendChart />
    </>
  );
}
