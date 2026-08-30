import type { Task } from "@/features/tasks";
import { seedProjects, type Project } from "@/lib/project-store";

export type { Project } from "@/lib/project-store";

/** Static seed list — prefer useProjects() / useActiveProjects() in components. */
export const projects: Project[] = seedProjects;

export const projectById = (id?: string, list: Project[] = []) =>
  list.find((p: Project) => p.id === id || p._id === id);
export const projectName = (id?: string, list: Project[] = []) =>
  projectById(id, list)?.name ?? "—";
export const projectCode = (id?: string, list: Project[] = []) =>
  projectById(id, list)?.code ?? "—";

export interface ProjectStats {
  total: number;
  available: number;
  completed: number;
  pending: number;
  inReview: number;
  employees: number;
  hasActiveWork: boolean;
}

/** Live counters for a project derived from the task list. */
export function projectStats(tasks: Task[], projectId: string): ProjectStats {
  const list = tasks.filter((t) => t.projectId === projectId);
  const completed = list.filter((t) => t.status === "completed" || t.reviewState === "approved");
  const inReview = list.filter((t) => t.reviewState === "in_review");
  const available = list.filter((t) => t.status === "available" && !t.assigneeId);
  const pending = list.filter(
    (t) => !completed.includes(t) && !available.includes(t) && t.reviewState !== "rejected",
  );
  const employees = new Set(
    list.filter((t) => t.assigneeId && t.status !== "completed").map((t) => t.assigneeId),
  );
  return {
    total: list.length,
    available: available.length,
    completed: completed.length,
    pending: pending.length,
    inReview: inReview.length,
    employees: employees.size,
    hasActiveWork: pending.length > 0 || inReview.length > 0 || employees.size > 0,
  };
}
