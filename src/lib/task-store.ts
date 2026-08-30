import { useTasksQuery } from "@/features/tasks/hooks/use-tasks-api";
import type { Task, TaskType } from "@/features/tasks/types";

export type { Task, TaskType };

export const taskTypeLabel: Record<TaskType, string> = {
  universal: "Universal",
  project: "Project",
  direct: "Direct",
};

/** Hook returning all tasks from the backend API. */
export function useAllTasks(): Task[] {
  const { data } = useTasksQuery();
  return data ?? [];
}

/** Hook returning open Universal tasks. */
export function useUniversalPool(): Task[] {
  return useAllTasks().filter(
    (t) =>
      (t.taskType === "universal" || (t.taskType as string) === "Universal") &&
      (t.status === "available" || (t.status as string) === "Open") &&
      !t.assigneeId,
  );
}

/** Hook returning open Project tasks. */
export function useProjectPool(): Task[] {
  return useAllTasks().filter(
    (t) =>
      (t.taskType === "project" || (t.taskType as string) === "Project") &&
      (t.status === "available" || (t.status as string) === "Open") &&
      !t.assigneeId,
  );
}
