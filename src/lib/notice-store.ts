import { useSyncExternalStore } from "react";
import { logAudit } from "@/lib/audit-log";

/**
 * Frontend-only notice board store. Admin-created notices persisted to
 * localStorage, plus a few seeded announcements.
 */

export type NoticeType =
  | "announcement"
  | "important"
  | "meeting"
  | "holiday"
  | "maintenance"
  | "policy"
  | "event";

export type NoticePriority = "low" | "medium" | "high" | "urgent";
export type NoticeStatus = "published" | "draft";

export interface NoticeAttachment {
  name: string;
  size: number;
  type: string;
}

export interface Notice {
  id: string;
  headline: string;
  content: string;
  type: NoticeType;
  audience: string;
  priority: NoticePriority;
  publishDate: string;
  expiryDate?: string;
  attachment?: NoticeAttachment;
  status: NoticeStatus;
  pinned: boolean;
  createdBy: string;
  createdAt: string;
}

export const noticeTypeMeta: Record<NoticeType, { label: string; icon: string }> = {
  announcement: { label: "Announcement", icon: "📢" },
  important: { label: "Important", icon: "⚠" },
  meeting: { label: "Meeting", icon: "👥" },
  holiday: { label: "Holiday", icon: "🎉" },
  maintenance: { label: "Maintenance", icon: "🛠" },
  policy: { label: "Policy Update", icon: "📄" },
  event: { label: "Event", icon: "📅" },
};

export const noticeTypes = Object.keys(noticeTypeMeta) as NoticeType[];

export const noticeAudiences = [
  "Everyone",
  "All Employees",
  "Engineering",
  "Sales",
  "Product",
  "QA",
  "HR",
  "Design",
];

export const noticePriorityMeta: Record<NoticePriority, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", className: "bg-info/15 text-info" },
  high: { label: "High", className: "bg-warning/15 text-warning" },
  urgent: { label: "Urgent", className: "bg-destructive/15 text-destructive" },
};

export const noticePriorities = Object.keys(noticePriorityMeta) as NoticePriority[];

export function isExpired(n: Notice) {
  if (!n.expiryDate) return false;
  return new Date(n.expiryDate) < new Date(new Date().toISOString().slice(0, 10));
}

/** Published / Draft / Expired — display status. */
export function noticeStatus(n: Notice): "published" | "draft" | "expired" {
  if (n.status === "draft") return "draft";
  return isExpired(n) ? "expired" : "published";
}

const seedNotices: Notice[] = [
  {
    id: "nt-seed-1",
    headline: "Quarterly all-hands on Friday",
    content:
      "Join the leadership team for the Q3 all-hands. We'll cover revenue, product roadmap, and the new performance framework. Attendance is expected for every department.",
    type: "meeting",
    audience: "Everyone",
    priority: "high",
    publishDate: "2026-07-27",
    status: "published",
    pinned: true,
    createdBy: "Dimisi Directors",
    createdAt: "2026-07-27T09:00:00Z",
  },
  {
    id: "nt-seed-2",
    headline: "Updated leave policy effective August",
    content:
      "The revised leave policy introduces two additional wellness days per quarter and a simplified approval flow through the Poll portal.",
    type: "policy",
    audience: "All Employees",
    priority: "medium",
    publishDate: "2026-07-24",
    status: "published",
    pinned: false,
    createdBy: "HR Team",
    createdAt: "2026-07-24T09:00:00Z",
  },
  {
    id: "nt-seed-3",
    headline: "Scheduled maintenance window",
    content:
      "Internal tooling will be unavailable Saturday 01:00–04:00 IST while we upgrade the deployment pipeline.",
    type: "maintenance",
    audience: "Engineering",
    priority: "low",
    publishDate: "2026-07-20",
    expiryDate: "2026-07-26",
    status: "published",
    pinned: false,
    createdBy: "Platform Team",
    createdAt: "2026-07-20T09:00:00Z",
  },
];

const KEY = "dimisi-notices";
const empty: Notice[] = [];

const g = globalThis as unknown as { __dimisiNotices?: Notice[] };
let created: Notice[] = g.__dimisiNotices ?? empty;
let removedSeeds: string[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

interface Persisted {
  created: Notice[];
  removedSeeds: string[];
  seedEdits: Record<string, Partial<Notice>>;
}
let seedEdits: Record<string, Partial<Notice>> = {};

function persist() {
  g.__dimisiNotices = created;
  try {
    localStorage.setItem(KEY, JSON.stringify({ created, removedSeeds, seedEdits } satisfies Persisted));
  } catch {}
  cacheKey = null;
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Persisted;
      created = p.created ?? [];
      removedSeeds = p.removedSeeds ?? [];
      seedEdits = p.seedEdits ?? {};
      g.__dimisiNotices = created;
      cacheKey = null;
      listeners.forEach((l) => l());
    }
  } catch {}
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function compute(): Notice[] {
  return [...seedNotices.map((n) => ({ ...n, ...(seedEdits[n.id] ?? {}) })), ...created]
    .filter((n) => !removedSeeds.includes(n.id))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.publishDate.localeCompare(a.publishDate) || b.createdAt.localeCompare(a.createdAt);
    });
}

let cacheKey: object | null = null;
let cacheList: Notice[] = [];
const getSnapshot = () => {
  if (!cacheKey) {
    cacheKey = {};
    cacheList = compute();
  }
  return cacheList;
};
const serverList = compute();
const getServerSnapshot = () => serverList;

export function useNotices(): Notice[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Notices visible to employees: published and not expired. */
export function useEmployeeNotices(): Notice[] {
  return useNotices().filter((n) => noticeStatus(n) === "published");
}

export type NewNoticeInput = Omit<Notice, "id" | "createdAt" | "pinned"> & { pinned?: boolean };

export function createNotice(input: NewNoticeInput): Notice {
  hydrate();
  const notice: Notice = {
    ...input,
    pinned: input.pinned ?? false,
    id: `nt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  if (notice.pinned) unpinAllSilently();
  created = [...created, notice];
  persist();
  logAudit({
    category: "notice",
    action: notice.status === "published" ? "Published Notice" : "Saved Notice Draft",
    target: notice.headline,
    details: `${noticeTypeMeta[notice.type].label} · ${notice.priority} priority · audience ${notice.audience}.`,
    actorName: notice.createdBy,
  });
  return notice;
}

function unpinAllSilently() {
  created = created.map((n) => (n.pinned ? { ...n, pinned: false } : n));
  for (const s of seedNotices) {
    const merged = { ...s, ...(seedEdits[s.id] ?? {}) };
    if (merged.pinned) seedEdits = { ...seedEdits, [s.id]: { ...(seedEdits[s.id] ?? {}), pinned: false } };
  }
}

export function updateNotice(id: string, patch: Partial<Notice>) {
  hydrate();
  if (patch.pinned) unpinAllSilently();
  if (created.some((n) => n.id === id)) {
    created = created.map((n) => (n.id === id ? { ...n, ...patch } : n));
  } else {
    seedEdits = { ...seedEdits, [id]: { ...(seedEdits[id] ?? {}), ...patch } };
  }
  persist();
  if (!("pinned" in patch) || Object.keys(patch).length > 1) {
    logAudit({
      category: "notice",
      action: "Updated Notice",
      target: patch.headline ?? compute().find((n) => n.id === id)?.headline ?? id,
      details: `Fields updated: ${Object.keys(patch).join(", ")}.`,
    });
  } else {
    logAudit({
      category: "notice",
      action: patch.pinned ? "Pinned Notice" : "Unpinned Notice",
      target: compute().find((n) => n.id === id)?.headline ?? id,
      details: patch.pinned ? "Notice pinned to the top of the board." : "Notice unpinned.",
    });
  }
}

export function deleteNotice(id: string) {
  hydrate();
  created = created.filter((n) => n.id !== id);
  const removed = compute().find((n) => n.id === id);
  if (seedNotices.some((n) => n.id === id)) removedSeeds = [...removedSeeds, id];
  persist();
  logAudit({
    category: "notice",
    action: "Deleted Notice",
    target: removed?.headline ?? id,
    details: "Notice removed from every notice board.",
    status: "warning",
  });
}

export function duplicateNotice(id: string): Notice | undefined {
  hydrate();
  const source = compute().find((n) => n.id === id);
  if (!source) return;
  const { id: _omit, createdAt: _omit2, ...rest } = source;
  return createNotice({ ...rest, headline: `${source.headline} (Copy)`, status: "draft", pinned: false });
}

/** Pin exactly one notice — pinning another unpins the previous. */
export function pinNotice(id: string) {
  hydrate();
  const target = compute().find((n) => n.id === id);
  updateNotice(id, { pinned: !target?.pinned });
}
