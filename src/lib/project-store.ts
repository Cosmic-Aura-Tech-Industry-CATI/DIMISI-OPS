import { useSyncExternalStore } from "react";
import { logAudit } from "@/lib/audit-log";

/**
 * Frontend-only project catalogue. Seed projects plus admin-created ones,
 * with edits / archive / delete overrides persisted to localStorage.
 */

export type ProjectStatus = "active" | "inactive" | "archived";

export interface Project {
  id: string;
  /** Standardised, read-only project ID — DMSPRJ001 … */
  code: string;
  name: string;
  description: string;
  manager?: string;
  status: ProjectStatus;
  color?: string;
  createdAt: string;
  createdBy: string;
  templates: string[];
}

export const projectStatusLabel: Record<ProjectStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
};

export const projectStatusStyles: Record<ProjectStatus, string> = {
  active: "bg-success/15 text-success",
  inactive: "bg-muted text-muted-foreground",
  archived: "bg-warning/15 text-warning",
};

export const projectColors = [
  "#C9A961",
  "#8FB8A8",
  "#B98B7A",
  "#7E93B8",
  "#A98BB9",
  "#D9D9D9",
];

export const seedProjects: Project[] = [
  {
    id: "dimisi",
    code: "DMSPRJ001",
    name: "Dimisi",
    description: "Core product platform",
    manager: "Aarav Mehta",
    status: "active",
    color: "#C9A961",
    createdAt: "2025-01-12",
    createdBy: "Dimisi Directors",
    templates: [
      "Landing Page Development",
      "Authentication Module",
      "Dashboard UI",
      "Employee Management",
      "Reports Module",
      "Notification System",
    ],
  },
  {
    id: "kalesh",
    code: "DMSPRJ002",
    name: "Kalesh",
    description: "Anonymous opinion network",
    manager: "Ishita Rao",
    status: "active",
    color: "#8FB8A8",
    createdAt: "2025-02-04",
    createdBy: "Dimisi Directors",
    templates: [
      "Opinion Feed",
      "Anonymous Posting",
      "Reaction System",
      "Admin Moderation",
      "Reporting System",
      "Analytics",
    ],
  },
  {
    id: "rudra",
    code: "DMSPRJ003",
    name: "Rudra Tours & Travels",
    description: "Travel booking platform",
    manager: "Kabir Shah",
    status: "active",
    color: "#B98B7A",
    createdAt: "2025-03-18",
    createdBy: "Dimisi Directors",
    templates: [
      "Booking System",
      "Destination Page",
      "Admin Dashboard",
      "Tour Packages",
      "Payment Integration",
      "Reviews",
    ],
  },
  {
    id: "poll",
    code: "DMSPRJ004",
    name: "Poll",
    description: "Task & performance suite",
    manager: "Neha Kulkarni",
    status: "active",
    color: "#7E93B8",
    createdAt: "2025-04-27",
    createdBy: "Dimisi Directors",
    templates: ["Survey Builder", "Response Analytics", "Team Workspaces", "Export Module"],
  },
  {
    id: "portfolio",
    code: "DMSPRJ005",
    name: "Portfolio",
    description: "Agency showcase site",
    manager: "Rohan Verma",
    status: "active",
    color: "#A98BB9",
    createdAt: "2025-05-09",
    createdBy: "Dimisi Directors",
    templates: ["Case Study Layout", "Motion Hero", "Contact Form", "SEO Optimisation"],
  },
];

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
  } catch {}
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProjectState;
      state = { created: parsed.created ?? [], edits: parsed.edits ?? {}, deleted: parsed.deleted ?? [] };
      g.__dimisiProjects = state;
      listeners.forEach((l) => l());
    }
  } catch {}
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function compute(s: ProjectState): Project[] {
  return [...seedProjects, ...s.created]
    .filter((p) => !s.deleted.includes(p.id))
    .map((p) => ({ ...p, ...(s.edits[p.id] ?? {}) }))
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

/** Every project, including inactive and archived ones. */
export function useProjects(): Project[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Only projects that can receive new tasks. */
export function useActiveProjects(): Project[] {
  return useProjects().filter((p) => p.status === "active");
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
  status?: Exclude<ProjectStatus, "archived">;
  color?: string;
  createdBy?: string;
}

export function isNameTaken(name: string, ignoreId?: string) {
  const n = name.trim().toLowerCase();
  return allProjects().some((p) => p.id !== ignoreId && p.name.trim().toLowerCase() === n);
}

export function createProject(input: NewProjectInput): Project {
  hydrate();
  const project: Project = {
    id: `pr-${Date.now()}`,
    code: input.code?.trim() || nextProjectCode(),
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    manager: input.manager?.trim() || undefined,
    status: input.status ?? "active",
    color: input.color,
    createdAt: new Date().toISOString().slice(0, 10),
    createdBy: input.createdBy ?? "Admin",
    templates: [],
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
  const before = compute(state).find((p) => p.id === id);
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
  const project = allProjects().find((p) => p.id === id);
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
  const project = compute(state).find((p) => p.id === id);
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
    created: state.created.filter((p) => p.id !== id),
    deleted: [...state.deleted, id],
  });
}
