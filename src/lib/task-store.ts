import { useSyncExternalStore } from "react";
import { currentEmployee, tasks as seedTasks, type Task, type TaskType } from "@/lib/mock-data";
import { logAudit } from "@/lib/audit-log";

/**
 * Frontend-only task store. Holds tasks created from the admin panel plus the
 * "picks" employees have made on universal / project tasks. Persisted to
 * localStorage — no backend.
 */

interface Pick {
  taskId: string;
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  pickedAt: string;
}

interface TaskState {
  created: Task[];
  picks: Pick[];
}

const KEY = "dimisi-tasks";
const empty: TaskState = { created: [], picks: [] };

const g = globalThis as unknown as { __dimisiTasks?: TaskState };
let state: TaskState = g.__dimisiTasks ?? empty;
let hydrated = false;
const listeners = new Set<() => void>();

function setState(next: TaskState) {
  state = next;
  g.__dimisiTasks = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TaskState;
      state = { created: parsed.created ?? [], picks: parsed.picks ?? [] };
      g.__dimisiTasks = state;
      listeners.forEach((l) => l());
    }
  } catch {}
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Seed tasks + created tasks, with picks applied. Oldest first. */
function computeAll(s: TaskState): Task[] {
  const byPick = new Map(s.picks.map((p) => [p.taskId, p]));
  return [...seedTasks, ...s.created]
    .map((t) => {
      const pick = byPick.get(t.id);
      if (!pick) return t;
      return {
        ...t,
        assignee: pick.employeeName,
        assigneeId: pick.employeeId,
        assigneeCode: pick.employeeCode ?? t.assigneeCode,
        assignedAt: pick.pickedAt,
        status: t.status === "available" ? ("assigned" as const) : t.status,
      };
    })
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

let cacheState: TaskState | null = null;
let cacheList: Task[] = [];
const getSnapshot = () => {
  if (cacheState !== state) {
    cacheState = state;
    cacheList = computeAll(state);
  }
  return cacheList;
};
const serverList = computeAll(empty);
const getServerSnapshot = () => serverList;

/** Every task visible to the platform. */
export function useAllTasks(): Task[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Universal tasks nobody has picked yet. */
export function useUniversalPool(): Task[] {
  return useAllTasks().filter((t) => t.taskType === "universal" && t.status === "available" && !t.assigneeId);
}

/** Project tasks nobody has picked yet. */
export function useProjectPool(): Task[] {
  return useAllTasks().filter((t) => t.taskType === "project" && t.status === "available" && !t.assigneeId);
}

export interface NewTaskInput {
  title: string;
  description: string;
  category: string;
  priority: Task["priority"];
  points: number;
  dueDate: string;
  notes?: string;
  attachments?: { name: string; size: string }[];
  taskType: TaskType;
  projectId?: string;
  estimatedTime?: string;
  assigneeId?: string;
  assigneeName?: string;
  createdBy?: string;
}

export function createTask(input: NewTaskInput): Task {
  hydrate();
  const direct = input.taskType === "direct";
  const task: Task = {
    id: `nt-${Date.now()}`,
    title: input.title.trim(),
    description: input.description.trim(),
    assignee: direct ? (input.assigneeName ?? "") : "",
    assigneeId: direct ? (input.assigneeId ?? "") : "",
    status: direct ? "pending" : "available",
    priority: input.priority,
    points: input.points,
    dueDate: input.dueDate,
    createdAt: new Date().toISOString().slice(0, 10),
    category: input.category,
    createdBy: input.createdBy,
    notes: input.notes,
    attachments: input.attachments,
    taskType: input.taskType,
    projectId: input.taskType === "project" ? input.projectId : undefined,
    estimatedTime: input.estimatedTime,
  };
  setState({ ...state, created: [...state.created, task] });
  logAudit({
    category: "task",
    action:
      input.taskType === "universal"
        ? "Created Universal Task"
        : input.taskType === "project"
          ? "Created Project Task"
          : "Assigned Task",
    target: task.title,
    targetId: task.assigneeId || undefined,
    details:
      input.taskType === "direct"
        ? `Direct assignment to ${task.assignee || "an employee"} — ${task.points} points.`
        : `${task.points} reward points · due ${task.dueDate}.`,
  });
  return task;
}

/**
 * Claim an open task — first come, first served. Re-reads the persisted state so
 * a claim made in another tab still wins the race.
 */
export function pickTask(taskId: string, employee = currentEmployee) {
  hydrate();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TaskState;
      state = { created: parsed.created ?? [], picks: parsed.picks ?? [] };
    }
  } catch {}
  if (state.picks.some((p) => p.taskId === taskId)) return false;
  setState({
    ...state,
    picks: [
      ...state.picks,
      {
        taskId,
        employeeId: employee.id,
        employeeName: employee.name,
        employeeCode: employee.code,
        pickedAt: new Date().toISOString(),
      },
    ],
  });
  logAudit({
    category: "task",
    action: "Employee Picked Task",
    target: computeAll(state).find((t) => t.id === taskId)?.title ?? taskId,
    targetId: employee.code,
    details: `Task claimed from the open pool by ${employee.name}.`,
    actorName: employee.name,
    actorId: employee.code,
  });
  return true;
}

export const taskTypeLabel: Record<TaskType, string> = {
  universal: "Universal",
  project: "Project",
  direct: "Direct",
};
