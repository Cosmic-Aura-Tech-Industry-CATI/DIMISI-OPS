import { useMemo } from "react";
import { employees } from "@/lib/mock-data";
import { projectStats } from "@/lib/projects";
import { useProjectsQuery } from "@/features/projects";
import { useTasksQuery, type Task } from "@/features/tasks";

export type EmployeeReportRow = {
  id: string;
  name: string;
  avatar: string;
  department: string;
  points: number;
  assigned: number;
  completed: number;
  overdue: number;
  rate: number;
};
export type ProjectReportRow = ReturnType<typeof useProjectReport>[number];
export type TaskBucket = { label: string; key: string; value: number; tone: string };
export type DepartmentReportRow = {
  department: string;
  employees: number;
  points: number;
  completed: number;
  assigned: number;
  rate: number;
};

export function useProjectReport() {
  const { data: projectList = [] } = useProjectsQuery();
  const { data: liveTasks = [] } = useTasksQuery();

  return useMemo(
    () =>
      projectList.map((p) => {
        const targetId = p._id || p.id;
        const s = projectStats(liveTasks, targetId);
        return {
          id: targetId,
          code: p.code,
          name: p.name,
          manager: p.manager,
          status: p.status,
          color: p.color,
          total: p.analytics?.totalTasks ?? s.total,
          available: s.available,
          inReview: s.inReview,
          completed: p.analytics?.completedTasks ?? s.completed,
          pending: s.pending,
          employees: s.employees,
          rate: (p.analytics?.totalTasks ?? s.total)
            ? Math.round(((p.analytics?.completedTasks ?? s.completed) / (p.analytics?.totalTasks ?? s.total)) * 100)
            : 0,
        };
      }),
    [projectList, liveTasks],
  );
}

export function useReportData() {
  const { data: tasks = [] } = useTasksQuery();

  const employeeReport = useMemo(() => {
    return employees
      .map((e) => {
        const mine = tasks.filter((t) => t.assigneeId === e.id || t.assignee === e.name);
        const completed = mine.filter((t) => t.status === "completed").length;
        const overdue = mine.filter((t) => t.status === "overdue").length;
        const rate = mine.length ? Math.round((completed / mine.length) * 100) : 0;
        return {
          id: e.id,
          name: e.name,
          avatar: e.avatar,
          department: e.department,
          points: e.points,
          assigned: mine.length,
          completed,
          overdue,
          rate,
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [tasks]);

  const taskReport = useMemo<TaskBucket[]>(() => {
    const buckets: Record<string, number> = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
      available: 0,
      assigned: 0,
    };
    for (const t of tasks) {
      if (buckets[t.status] !== undefined) buckets[t.status]++;
    }
    return [
      { label: "Pending", key: "pending", value: buckets.pending, tone: "text-primary" },
      { label: "In Progress", key: "in_progress", value: buckets.in_progress, tone: "text-primary" },
      { label: "Completed", key: "completed", value: buckets.completed, tone: "text-primary" },
      { label: "Overdue", key: "overdue", value: buckets.overdue, tone: "text-primary" },
    ];
  }, [tasks]);

  const priorityMix = useMemo(() => {
    const p = { high: 0, medium: 0, low: 0 };
    for (const t of tasks) {
      if (t.priority && p[t.priority] !== undefined) p[t.priority]++;
    }
    return [
      { name: "High", value: p.high },
      { name: "Medium", value: p.medium },
      { name: "Low", value: p.low },
    ];
  }, [tasks]);

  const departmentReport = useMemo<DepartmentReportRow[]>(() => {
    const map = new Map<string, Omit<DepartmentReportRow, "rate">>();
    for (const e of employees) {
      const mine = tasks.filter((t) => t.assigneeId === e.id || t.assignee === e.name);
      const cur =
        map.get(e.department) ??
        { department: e.department, employees: 0, points: 0, completed: 0, assigned: 0 };
      cur.employees += 1;
      cur.points += e.points;
      cur.assigned += mine.length;
      cur.completed += mine.filter((t) => t.status === "completed").length;
      map.set(e.department, cur);
    }
    return Array.from(map.values())
      .map((d) => ({ ...d, rate: d.assigned ? Math.round((d.completed / d.assigned) * 100) : 0 }))
      .sort((a, b) => b.points - a.points);
  }, [tasks]);

  const departmentRadar = useMemo(
    () =>
      departmentReport.map((d) => ({
        department: d.department,
        Score: Math.round((d.rate + Math.min(100, d.points / 20)) / 2),
      })),
    [departmentReport],
  );

  const kpis = useMemo(() => {
    const totalPoints = employees.reduce((s, e) => s + e.points, 0);
    const totalCompleted = tasks.filter((t) => t.status === "completed").length;
    const avgRate = Math.round(
      employeeReport.reduce((s, e) => s + e.rate, 0) / (employeeReport.length || 1),
    );
    return { totalPoints, totalCompleted, avgRate };
  }, [employeeReport, tasks]);

  return { employeeReport, taskReport, priorityMix, departmentReport, departmentRadar, kpis };
}
