import { useMemo } from "react";
import { employees, tasks } from "@/lib/mock-data";
import { projectStats } from "@/lib/projects";
import { useProjects } from "@/lib/project-store";
import { useAllTasks } from "@/lib/task-store";

export type EmployeeReportRow = ReturnType<typeof buildEmployeeReport>[number];
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

function buildEmployeeReport() {
  return employees
    .map((e) => {
      const mine = tasks.filter((t) => t.assigneeId === e.id);
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
}

export function useProjectReport() {
  const projectList = useProjects();
  const liveTasks = useAllTasks();

  return useMemo(
    () =>
      projectList.map((p) => {
        const s = projectStats(liveTasks, p.id);
        return {
          id: p.id,
          code: p.code,
          name: p.name,
          manager: p.manager,
          status: p.status,
          color: p.color,
          total: s.total,
          available: s.available,
          inReview: s.inReview,
          completed: s.completed,
          pending: s.pending,
          employees: s.employees,
          rate: s.total ? Math.round((s.completed / s.total) * 100) : 0,
        };
      }),
    [projectList, liveTasks],
  );
}

export function useReportData() {
  const employeeReport = useMemo(buildEmployeeReport, []);

  const taskReport = useMemo<TaskBucket[]>(() => {
    const buckets: Record<string, number> = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
      available: 0,
      assigned: 0,
    };
    for (const t of tasks) buckets[t.status]++;
    return [
      { label: "Pending", key: "pending", value: buckets.pending, tone: "text-primary" },
      { label: "In Progress", key: "in_progress", value: buckets.in_progress, tone: "text-primary" },
      { label: "Completed", key: "completed", value: buckets.completed, tone: "text-primary" },
      { label: "Overdue", key: "overdue", value: buckets.overdue, tone: "text-primary" },
    ];
  }, []);

  const priorityMix = useMemo(() => {
    const p = { high: 0, medium: 0, low: 0 };
    for (const t of tasks) p[t.priority]++;
    return [
      { name: "High", value: p.high },
      { name: "Medium", value: p.medium },
      { name: "Low", value: p.low },
    ];
  }, []);

  const departmentReport = useMemo<DepartmentReportRow[]>(() => {
    const map = new Map<string, Omit<DepartmentReportRow, "rate">>();
    for (const e of employees) {
      const mine = tasks.filter((t) => t.assigneeId === e.id);
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
  }, []);

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
  }, [employeeReport]);

  return { employeeReport, taskReport, priorityMix, departmentReport, departmentRadar, kpis };
}
