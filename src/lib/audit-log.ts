import { useSyncExternalStore } from "react";

/**
 * Frontend-only audit trail. Every important action in the app calls
 * `logAudit(...)`; entries are append-only and persisted to localStorage.
 * Admins can read, search, filter and export — never create or edit.
 */

export type AuditCategory =
  | "employee"
  | "admin"
  | "task"
  | "project"
  | "notice"
  | "authentication"
  // | "system"
  // | "leaderboard"
  | "reports"
  | "settings";

export type AuditStatus = "success" | "warning" | "failed";

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorId: string;
  category: AuditCategory;
  action: string;
  target: string;
  targetId?: string;
  details: string;
  status: AuditStatus;
  previousValue?: string;
  updatedValue?: string;
  device: string;
  browser: string;
  ip: string;
}

export const auditCategoryMeta: Record<AuditCategory, { label: string; className: string }> = {
  employee: { label: "Employee", className: "bg-info/15 text-info" },
  admin: { label: "Admin", className: "bg-primary/15 text-primary" },
  task: { label: "Task", className: "bg-success/15 text-success" },
  project: { label: "Project", className: "bg-warning/15 text-warning" },
  notice: { label: "Notice", className: "bg-primary/15 text-primary" },
  authentication: { label: "Authentication", className: "bg-muted text-muted-foreground" },
  // system: { label: "System", className: "bg-muted text-muted-foreground" },
  // leaderboard: { label: "Leaderboard", className: "bg-success/15 text-success" },
  reports: { label: "Reports", className: "bg-info/15 text-info" },
  settings: { label: "Settings", className: "bg-muted text-muted-foreground" },
};

export const auditCategories = Object.keys(auditCategoryMeta) as AuditCategory[];

export const auditStatusMeta: Record<AuditStatus, { label: string; className: string }> = {
  success: { label: "Success", className: "bg-success/15 text-success" },
  warning: { label: "Warning", className: "bg-warning/15 text-warning" },
  failed: { label: "Failed", className: "bg-destructive/15 text-destructive" },
};

const devices = ["MacBook Pro · macOS 15", "Windows 11 Desktop", "iPad Pro", "iPhone 17", "ThinkPad · Ubuntu 24.04"];
const browsers = ["Chrome 141", "Safari 19", "Firefox 143", "Edge 141"];
const ips = ["103.21.244.18", "49.36.187.204", "182.71.14.92", "157.32.208.11", "106.51.77.140"];

function mockEnv(seed: number) {
  return {
    device: devices[seed % devices.length],
    browser: browsers[seed % browsers.length],
    ip: ips[seed % ips.length],
  };
}

/** ------------------------------------------------------------------ seed */

interface SeedInput {
  hoursAgo: number;
  actorName: string;
  actorId: string;
  category: AuditCategory;
  action: string;
  target: string;
  targetId?: string;
  details: string;
  status?: AuditStatus;
  previousValue?: string;
  updatedValue?: string;
}

const BASE = new Date("2026-07-30T10:35:00Z").getTime();

const seedRaw: SeedInput[] = [
  { hoursAgo: 0, actorName: "Shikhar Dixit", actorId: "DMSDIR01", category: "employee", action: "Added Employee", target: "Rahul Sharma", targetId: "DMSEMP2607", details: "Created employee account for the Engineering team." },
  { hoursAgo: 2, actorName: "Shikhar Dixit", actorId: "DMSDIR01", category: "admin", action: "Created Admin", target: "Rohan Singh", targetId: "DMSADM05", details: "New admin account provisioned with management access." },
  { hoursAgo: 4, actorName: "Rhea Kapoor", actorId: "DMSDIR02", category: "task", action: "Created Universal Task", target: "Database Optimization", details: "Universal task published to the open pool — 120 reward points." },
  { hoursAgo: 6, actorName: "Rhea Kapoor", actorId: "DMSDIR02", category: "task", action: "Created Project Task", target: "Kalesh", details: "Project task “Opinion Moderation” added under project Kalesh." },
  { hoursAgo: 8, actorName: "Shikhar Dixit", actorId: "DMSDIR01", category: "task", action: "Assigned Task", target: "Aman Gupta", targetId: "DMSEMP2605", details: "Direct assignment: “Enterprise SSO rollout”." },
  { hoursAgo: 10, actorName: "Neha Kulkarni", actorId: "DMSEMP2609", category: "task", action: "Employee Picked Task", target: "UI Improvement", targetId: "DMSEMP2609", details: "Task claimed from the universal pool (first come, first served)." },
  { hoursAgo: 12, actorName: "Aman Gupta", actorId: "DMSEMP2605", category: "task", action: "Submitted Task", target: "Payment Integration", details: "Proof submitted: 2 screenshots, 1 PDF." },
  { hoursAgo: 13, actorName: "Rhea Kapoor", actorId: "DMSDIR02", category: "task", action: "Approved Submission", target: "Payment Integration", details: "Submission approved — 150 points awarded." },
  { hoursAgo: 15, actorName: "Shikhar Dixit", actorId: "DMSDIR01", category: "task", action: "Rejected Submission", target: "Legacy cron cleanup", details: "Reason: Incomplete proof.", status: "warning" },
  { hoursAgo: 20, actorName: "Shikhar Dixit", actorId: "DMSDIR01", category: "project", action: "Created Project", target: "Rudra Tours & Travels", targetId: "DMSPRJ003", details: "New project created with manager Kabir Shah." },
  { hoursAgo: 26, actorName: "Ishita Rao", actorId: "DMSADM03", category: "project", action: "Updated Project", target: "Kalesh", targetId: "DMSPRJ002", details: "Project manager and description updated.", previousValue: "Manager: Rohan Verma", updatedValue: "Manager: Ishita Rao" },
  { hoursAgo: 30, actorName: "Shikhar Dixit", actorId: "DMSDIR01", category: "project", action: "Archived Project", target: "Portfolio", targetId: "DMSPRJ005", details: "Project archived — no longer accepts new tasks.", status: "warning" },
  { hoursAgo: 34, actorName: "Rhea Kapoor", actorId: "DMSDIR02", category: "notice", action: "Published Notice", target: "Holiday Announcement", details: "Notice published to Everyone with High priority." },
  { hoursAgo: 40, actorName: "Rhea Kapoor", actorId: "DMSDIR02", category: "notice", action: "Updated Notice", target: "Updated leave policy effective August", details: "Content and expiry date revised.", previousValue: "Priority: Low", updatedValue: "Priority: Medium" },
  { hoursAgo: 46, actorName: "Shikhar Dixit", actorId: "DMSDIR01", category: "notice", action: "Deleted Notice", target: "Old maintenance window", details: "Expired notice removed from the board.", status: "warning" },
  { hoursAgo: 52, actorName: "Ishita Rao", actorId: "DMSADM03", category: "employee", action: "Edited Employee Profile", target: "Ava Chen", targetId: "DMSEMP2402", details: "Department and role updated.", previousValue: "Role: UI Designer", updatedValue: "Role: Product Designer" },
  { hoursAgo: 58, actorName: "Shikhar Dixit", actorId: "DMSDIR01", category: "employee", action: "Deleted Employee", target: "Karan Malhotra", targetId: "DMSEMP2503", details: "Employee offboarded and removed from the directory.", status: "warning" },
  { hoursAgo: 66, actorName: "Shikhar Dixit", actorId: "DMSDIR01", category: "admin", action: "Edited Admin Profile", target: "Ishita Rao", targetId: "DMSADM03", details: "Contact details updated." },
  { hoursAgo: 72, actorName: "Shikhar Dixit", actorId: "DMSDIR01", category: "admin", action: "Deleted Admin", target: "Vikram Nair", targetId: "DMSADM04", details: "Admin access revoked.", status: "warning" },
  // { hoursAgo: 80, actorName: "Rhea Kapoor", actorId: "DMSDIR02", category: "leaderboard", action: "Leaderboard Reset", target: "Monthly cycle", details: "Leaderboard standings reset for the new cycle." },
  { hoursAgo: 88, actorName: "Shikhar Dixit", actorId: "DMSDIR01", category: "settings", action: "Updated System Settings", target: "Workspace preferences", details: "Notification defaults changed.", previousValue: "Digest: Daily", updatedValue: "Digest: Weekly" },
  { hoursAgo: 96, actorName: "Ishita Rao", actorId: "DMSADM03", category: "reports", action: "Exported Report", target: "Monthly performance report", details: "Report exported as CSV." },
  { hoursAgo: 100, actorName: "Aman Gupta", actorId: "DMSEMP2605", category: "authentication", action: "Login", target: "Employee portal", details: "Signed in successfully." },
  { hoursAgo: 104, actorName: "Unknown", actorId: "—", category: "authentication", action: "Login", target: "Admin portal", details: "Failed sign-in attempt — invalid credentials.", status: "failed" },
  { hoursAgo: 110, actorName: "Neha Kulkarni", actorId: "DMSEMP2609", category: "authentication", action: "Password Changed", target: "Own account", details: "Password updated from the settings page." },
  { hoursAgo: 120, actorName: "Shikhar Dixit", actorId: "DMSDIR01", category: "authentication", action: "Logout", target: "Admin portal", details: "Session ended." },
  // { hoursAgo: 130, actorName: "System", actorId: "SYSTEM", category: "system", action: "Scheduled Maintenance", target: "Deployment pipeline", details: "Automated maintenance window completed." },
  // { hoursAgo: 150, actorName: "System", actorId: "SYSTEM", category: "system", action: "Data Backup", target: "Workspace snapshot", details: "Nightly backup completed successfully." },
];

const seedEntries: AuditEntry[] = seedRaw.map((s, i) => ({
  id: `au-seed-${i + 1}`,
  timestamp: new Date(BASE - s.hoursAgo * 3600_000).toISOString(),
  actorName: s.actorName,
  actorId: s.actorId,
  category: s.category,
  action: s.action,
  target: s.target,
  targetId: s.targetId,
  details: s.details,
  status: s.status ?? "success",
  previousValue: s.previousValue,
  updatedValue: s.updatedValue,
  ...mockEnv(i),
}));

/** ----------------------------------------------------------------- store */

const KEY = "dimisi-audit-logs";
const g = globalThis as unknown as { __dimisiAudit?: AuditEntry[] };
let recorded: AuditEntry[] = g.__dimisiAudit ?? [];
let hydrated = false;
const listeners = new Set<() => void>();
let cacheKey: object | null = null;
let cacheList: AuditEntry[] = [];

function compute(): AuditEntry[] {
  return [...recorded, ...seedEntries].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function persist() {
  g.__dimisiAudit = recorded;
  try {
    localStorage.setItem(KEY, JSON.stringify(recorded.slice(-500)));
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
      recorded = JSON.parse(raw) as AuditEntry[];
      g.__dimisiAudit = recorded;
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

const getSnapshot = () => {
  if (!cacheKey) {
    cacheKey = {};
    cacheList = compute();
  }
  return cacheList;
};
const serverList = compute();
const getServerSnapshot = () => serverList;

/** Read-only audit trail, newest first. */
export function useAuditLogs(): AuditEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export interface LogAuditInput {
  category: AuditCategory;
  action: string;
  target: string;
  targetId?: string;
  details?: string;
  status?: AuditStatus;
  previousValue?: string;
  updatedValue?: string;
  actorName?: string;
  actorId?: string;
}

/** Record an audit entry. Safe to call from anywhere; never throws. */
export function logAudit(input: LogAuditInput) {
  try {
    hydrate();
    let actorName = input.actorName;
    let actorId = input.actorId;
    if (!actorName || !actorId) {
      try {
        const raw = localStorage.getItem("poll-auth-user");
        if (raw) {
          const u = JSON.parse(raw) as { name?: string; code?: string };
          actorName ??= u.name;
          actorId ??= u.code;
        }
      } catch {}
    }
    const seed = recorded.length + 3;
    const entry: AuditEntry = {
      id: `au-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorName: actorName || "System",
      actorId: actorId || "SYSTEM",
      category: input.category,
      action: input.action,
      target: input.target,
      targetId: input.targetId,
      details: input.details ?? "",
      status: input.status ?? "success",
      previousValue: input.previousValue,
      updatedValue: input.updatedValue,
      ...mockEnv(seed),
    };
    recorded = [...recorded, entry];
    persist();
  } catch {}
}

/** ------------------------------------------------------------ formatting */

export function formatAuditTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
