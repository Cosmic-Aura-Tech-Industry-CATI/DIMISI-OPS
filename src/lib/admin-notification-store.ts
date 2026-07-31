import { useSyncExternalStore } from "react";

/**
 * Frontend-only admin notification feed. Admins are notified about approvals,
 * new task submissions and newly added employees / admins — never about points
 * (points are an employee-only reward signal).
 *
 * Entries older than 30 days are purged automatically.
 */

export type AdminNotifType = "approved" | "submission" | "new_employee" | "new_admin";

export interface AdminNotification {
  id: string;
  type: AdminNotifType;
  title: string;
  message: string;
  taskId?: string;
  timestamp: string;
  read: boolean;
}

const KEY = "dimisi-admin-notifications";
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

const empty: AdminNotification[] = [];

const g = globalThis as unknown as { __dimisiAdminNotifs?: AdminNotification[] };
let state: AdminNotification[] = g.__dimisiAdminNotifs ?? empty;
let hydrated = false;
const listeners = new Set<() => void>();

/** Drop anything older than a month. */
function purge(list: AdminNotification[]): AdminNotification[] {
  const cutoff = Date.now() - MONTH_MS;
  return list.filter((n) => {
    const t = new Date(n.timestamp).getTime();
    return Number.isNaN(t) ? false : t >= cutoff;
  });
}

function setState(next: AdminNotification[]) {
  state = purge(next);
  g.__dimisiAdminNotifs = state;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
}

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

function seed(): AdminNotification[] {
  return [
    {
      id: "an-seed-1",
      type: "submission",
      title: "New task submission",
      message: "Ava Chen submitted proof for “Q3 landing polish”.",
      timestamp: hoursAgo(2),
      read: false,
    },
    {
      id: "an-seed-2",
      type: "approved",
      title: "Task approved",
      message: "Rhea Kapoor approved “Fix mobile crash on iOS 19”.",
      timestamp: hoursAgo(9),
      read: false,
    },
    {
      id: "an-seed-3",
      type: "new_employee",
      title: "New employee added",
      message: "Julian Park was added to the Engineering team.",
      timestamp: hoursAgo(30),
      read: true,
    },
  ];
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    state = purge(raw ? (JSON.parse(raw) as AdminNotification[]) : seed());
  } catch {
    state = seed();
  }
  g.__dimisiAdminNotifs = state;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const getSnapshot = () => state;
const getServerSnapshot = () => empty;

export function useAdminNotifications(): AdminNotification[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function pushAdminNotif(input: Omit<AdminNotification, "id" | "timestamp" | "read">) {
  if (typeof window === "undefined") return;
  hydrate();
  setState([
    { ...input, id: `an-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: new Date().toISOString(), read: false },
    ...state,
  ]);
}

export function setAdminNotifRead(id: string, read: boolean) {
  hydrate();
  setState(state.map((n) => (n.id === id ? { ...n, read } : n)));
}

export function markAllAdminNotifsRead() {
  hydrate();
  setState(state.map((n) => ({ ...n, read: true })));
}
