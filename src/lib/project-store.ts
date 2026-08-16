import { useSyncExternalStore } from "react";
import { logAudit } from "@/lib/audit-log";
import type {
  Project,
  FrontendProjectStatus as ProjectStatus,
  ProjectAnalytics,
} from "@/features/projects";
import {
  projectColors,
  projectStatusLabel,
  projectStatusStyles,
} from "@/features/projects";

export type { Project, ProjectStatus, ProjectAnalytics };
export { projectColors, projectStatusLabel, projectStatusStyles };

/**
 * Seed projects list is empty — real project records are fetched from the database API.
 */
export const seedProjects: Project[] = [];

interface ProjectState {
  created: Project[];
  edits: Record<string, Partial<Project>>;
  deleted: string[];
}

const KEY = "dimisi-projects";
const empty: ProjectState = { created: [], edits: {}, deleted: [] };

const g = globalThis as unknown as { __dimisiProjects?: ProjectState };
let state: ProjectState = g.__dimisiProjects ?? empty;
let hydrated = false;
const listeners = new Set<() => void>();

function persist(next: ProjectState) {
  state = next;
  g.__dimisiProjects = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (_e) {
    // ignore storage quota errors
  }
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    // Clear any previous mock seed store data
    localStorage.removeItem(KEY);
    state = empty;
    g.__dimisiProjects = empty;
    listeners.forEach((l) => l());
  } catch (_e) {
    // ignore malformed storage payload
  }
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function compute(s: ProjectState): Project[] {
  return [...seedProjects, ...s.created]
    .filter((p) => !s.deleted.includes(p.id) && !s.deleted.includes(p._id))
    .map((p) => ({ ...p, ...(s.edits[p.id] ?? s.edits[p._id] ?? {}) }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

let cacheState: ProjectState | null = null;
let cacheList: Project[] = [];
const getSnapshot = () => {
  if (cacheState !== state) {
    cacheState = state;
    cacheList = compute(state);
  }
  return cacheList;
};
const serverList = compute(empty);
const getServerSnapshot = () => serverList;

/** Every project, including inactive and archived ones (fallback store). */
export function useProjects(): Project[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Only projects that can receive new tasks (fallback store). */
export function useActiveProjects(): Project[] {
  return useProjects().filter((p) => (p.status || "").toLowerCase() === "active");
}

/** Non-reactive read — safe for helpers such as projectName(). */
export function allProjects(): Project[] {
  hydrate();
  return compute(state);
}

export function nextProjectCode(list = allProjects()): string {
  const max = list.reduce((acc, p) => {
    const n = Number(p.code.replace(/\D/g, ""));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `DMSPRJ${String(max + 1).padStart(3, "0")}`;
}

export interface NewProjectInput {
  name: string;
  code?: string;
  description?: string;
  manager?: string;
  status?: Exclude<ProjectStatus, "archived" | "Archived">;
  color?: string;
  createdBy?: string;
}

export function isNameTaken(name: string, ignoreId?: string) {
  const n = name.trim().toLowerCase();
  return allProjects().some((p) => p.id !== ignoreId && p._id !== ignoreId && p.name.trim().toLowerCase() === n);
}

export function createProject(input: NewProjectInput): Project {
  hydrate();
  const id = `pr-${Date.now()}`;
  const project: Project = {
    _id: id,
    id: id,
    code: input.code?.trim() || nextProjectCode(),
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    manager: input.manager?.trim() || undefined,
    status: input.status ?? "active",
    color: input.color,
    isActive: true,
    createdAt: new Date().toISOString().slice(0, 10),
    createdBy: input.createdBy ?? "Admin",
    templates: [],
    analytics: { totalTasks: 0, completedTasks: 0, progressPercentage: 0 },
  };
  persist({ ...state, created: [...state.created, project] });
  logAudit({
    category: "project",
    action: "Created Project",
    target: project.name,
    targetId: project.code,
    details: `Project created${project.manager ? ` with manager ${project.manager}` : ""}.`,
    actorName: project.createdBy,
  });
  return project;
}

export function updateProject(id: string, patch: Partial<Project>, silent = false) {
  hydrate();
  const before = compute(state).find((p) => p.id === id || p._id === id);
  persist({ ...state, edits: { ...state.edits, [id]: { ...(state.edits[id] ?? {}), ...patch } } });
  if (!silent) {
    logAudit({
      category: "project",
      action: "Updated Project",
      target: patch.name ?? before?.name ?? id,
      targetId: before?.code,
      details: `Fields updated: ${Object.keys(patch).join(", ")}.`,
      previousValue: before?.status ? `Status: ${before.status}` : undefined,
      updatedValue: patch.status ? `Status: ${patch.status}` : undefined,
    });
  }
}

export function archiveProject(id: string) {
  const project = allProjects().find((p) => p.id === id || p._id === id);
  updateProject(id, { status: "archived" }, true);
  logAudit({
    category: "project",
    action: "Archived Project",
    target: project?.name ?? id,
    targetId: project?.code,
    details: "Project archived — it can no longer receive new tasks.",
    status: "warning",
  });
}

export function restoreProject(id: string) {
  updateProject(id, { status: "active" });
}

export function deleteProject(id: string) {
  hydrate();
  const project = compute(state).find((p) => p.id === id || p._id === id);
  logAudit({
    category: "project",
    action: "Deleted Project",
    target: project?.name ?? id,
    targetId: project?.code,
    details: "Project permanently deleted.",
    status: "warning",
  });
  persist({
    ...state,
    created: state.created.filter((p) => p.id !== id && p._id !== id),
    deleted: [...state.deleted, id],
  });
}
