import { useSyncExternalStore } from "react";
import { logAudit } from "@/lib/audit-log";

/**
 * Frontend-only department catalogue. Each department owns a list of
 * designations; both are fully editable / deletable by admins and directors.
 */

export interface Department {
  id: string;
  name: string;
  description?: string;
  designations: string[];
  createdAt: string;
}

const seedDepartments: Department[] = [
  {
    id: "engineering",
    name: "Engineering",
    description: "Product engineering and platform",
    designations: ["Frontend Developer", "Backend Developer", "QA Tester"],
    createdAt: "2025-01-05",
  },
  {
    id: "design",
    name: "Design",
    description: "Product and brand design",
    designations: ["UI Designer", "UX Designer"],
    createdAt: "2025-01-05",
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Growth, content and research",
    designations: ["Market Researcher", "Content Strategist"],
    createdAt: "2025-01-05",
  },
  {
    id: "operations",
    name: "Operations",
    description: "Internal operations and delivery",
    designations: ["Operations Executive", "Project Coordinator"],
    createdAt: "2025-01-05",
  },
  {
    id: "people",
    name: "People",
    description: "HR and talent",
    designations: ["HR Executive", "Recruiter"],
    createdAt: "2025-01-05",
  },
];

interface DeptState {
  created: Department[];
  edits: Record<string, Partial<Department>>;
  deleted: string[];
}

const KEY = "dimisi-departments";
const empty: DeptState = { created: [], edits: {}, deleted: [] };

const g = globalThis as unknown as { __dimisiDepts?: DeptState };
let state: DeptState = g.__dimisiDepts ?? empty;
let hydrated = false;
const listeners = new Set<() => void>();

function persist(next: DeptState) {
  state = next;
  g.__dimisiDepts = next;
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
      const parsed = JSON.parse(raw) as DeptState;
      state = {
        created: parsed.created ?? [],
        edits: parsed.edits ?? {},
        deleted: parsed.deleted ?? [],
      };
      g.__dimisiDepts = state;
      listeners.forEach((l) => l());
    }
  } catch {}
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function compute(s: DeptState): Department[] {
  return [...seedDepartments, ...s.created]
    .filter((d) => !s.deleted.includes(d.id))
    .map((d) => ({ ...d, ...(s.edits[d.id] ?? {}) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

let cacheState: DeptState | null = null;
let cacheList: Department[] = [];
const getSnapshot = () => {
  if (cacheState !== state) {
    cacheState = state;
    cacheList = compute(state);
  }
  return cacheList;
};
const serverList = compute(empty);
const getServerSnapshot = () => serverList;

export function useDepartments(): Department[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function allDepartments(): Department[] {
  hydrate();
  return compute(state);
}

/** Department names only — for simple dropdowns. */
export function departmentNames(): string[] {
  return allDepartments().map((d) => d.name);
}

/** Designations belonging to a department name (empty when unknown). */
export function designationsFor(departmentName: string): string[] {
  const dept = allDepartments().find(
    (d) => d.name.trim().toLowerCase() === departmentName.trim().toLowerCase(),
  );
  return dept ? dept.designations : [];
}

export function isDepartmentNameTaken(name: string, ignoreId?: string) {
  const n = name.trim().toLowerCase();
  return allDepartments().some((d) => d.id !== ignoreId && d.name.trim().toLowerCase() === n);
}

export function createDepartment(input: {
  name: string;
  description?: string;
  designations?: string[];
}): Department {
  hydrate();
  const dept: Department = {
    id: `dep-${Date.now()}`,
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    designations: (input.designations ?? []).map((d) => d.trim()).filter(Boolean),
    createdAt: new Date().toISOString().slice(0, 10),
  };
  persist({ ...state, created: [...state.created, dept] });
  logAudit({
    category: "settings",
    action: "Created Department",
    target: dept.name,
    details: `Department created with ${dept.designations.length} designation(s).`,
  });
  return dept;
}

export function updateDepartment(id: string, patch: Partial<Department>, silent = false) {
  hydrate();
  const before = compute(state).find((d) => d.id === id);
  persist({ ...state, edits: { ...state.edits, [id]: { ...(state.edits[id] ?? {}), ...patch } } });
  if (!silent) {
    logAudit({
      category: "settings",
      action: "Updated Department",
      target: patch.name ?? before?.name ?? id,
      details: `Fields updated: ${Object.keys(patch).join(", ")}.`,
    });
  }
}

export function deleteDepartment(id: string) {
  hydrate();
  const dept = compute(state).find((d) => d.id === id);
  logAudit({
    category: "settings",
    action: "Deleted Department",
    target: dept?.name ?? id,
    details: "Department and its designations removed.",
    status: "warning",
  });
  persist({
    ...state,
    created: state.created.filter((d) => d.id !== id),
    edits: Object.fromEntries(Object.entries(state.edits).filter(([k]) => k !== id)),
    deleted: [...state.deleted, id],
  });
}

export function addDesignation(deptId: string, title: string) {
  const dept = allDepartments().find((d) => d.id === deptId);
  if (!dept) return;
  const t = title.trim();
  if (!t || dept.designations.some((d) => d.toLowerCase() === t.toLowerCase())) return;
  updateDepartment(deptId, { designations: [...dept.designations, t] }, true);
  logAudit({
    category: "settings",
    action: "Added Designation",
    target: `${dept.name} › ${t}`,
    details: "Designation added to department.",
  });
}

export function renameDesignation(deptId: string, index: number, title: string) {
  const dept = allDepartments().find((d) => d.id === deptId);
  if (!dept) return;
  const t = title.trim();
  if (!t) return;
  const next = dept.designations.slice();
  const before = next[index];
  next[index] = t;
  updateDepartment(deptId, { designations: next }, true);
  logAudit({
    category: "settings",
    action: "Renamed Designation",
    target: `${dept.name} › ${t}`,
    previousValue: before,
    updatedValue: t,
    details: "Designation renamed.",
  });
}

export function removeDesignation(deptId: string, index: number) {
  const dept = allDepartments().find((d) => d.id === deptId);
  if (!dept) return;
  const removed = dept.designations[index];
  updateDepartment(
    deptId,
    { designations: dept.designations.filter((_, i) => i !== index) },
    true,
  );
  logAudit({
    category: "settings",
    action: "Deleted Designation",
    target: `${dept.name} › ${removed}`,
    details: "Designation removed from department.",
    status: "warning",
  });
}
