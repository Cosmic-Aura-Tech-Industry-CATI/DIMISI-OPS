import { useSyncExternalStore } from "react";
import type { Task } from "@/features/tasks";
import { pushAdminNotif } from "@/lib/admin-notification-store";

/**
 * Frontend-only review store. Records admin decisions (approve / reject /
 * remarks) on task submissions and the notifications those decisions raise for
 * the employee. Persisted to localStorage — no backend.
 */

export type ReviewDecision = "approved" | "rejected" | "remarks";

export interface ReviewRecord {
  taskId: string;
  decision: ReviewDecision;
  remarks: string;
  reviewer: string;
  reviewedAt: string;
}

export type ReviewNotifState = "unread" | "read" | "archived";

export interface ReviewNotification {
  id: string;
  taskId: string;
  type: "approved" | "rejected" | "remarks" | "points";
  title: string;
  message: string;
  points?: number;
  timestamp: string;
  state: ReviewNotifState;
}

interface ReviewState {
  reviews: ReviewRecord[];
  notifications: ReviewNotification[];
}

const KEY = "dimisi-reviews";
const empty: ReviewState = { reviews: [], notifications: [] };

const g = globalThis as unknown as { __dimisiReviews?: ReviewState };
let state: ReviewState = g.__dimisiReviews ?? empty;
let hydrated = false;
const listeners = new Set<() => void>();

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/** Notifications older than a month are dropped automatically. */
function purge(list: ReviewNotification[]): ReviewNotification[] {
  const cutoff = Date.now() - MONTH_MS;
  return list.filter((n) => {
    const t = new Date(n.timestamp).getTime();
    return Number.isNaN(t) ? true : t >= cutoff;
  });
}

function setState(next: ReviewState) {
  state = { ...next, notifications: purge(next.notifications) };
  next = state;
  g.__dimisiReviews = next;
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
      const parsed = JSON.parse(raw) as ReviewState;
      state = { reviews: parsed.reviews ?? [], notifications: purge(parsed.notifications ?? []) };
      g.__dimisiReviews = state;
      listeners.forEach((l) => l());
    }
  } catch {}
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const getSnapshot = () => state;
const getServerSnapshot = () => empty;

function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** All decisions keyed by task id. */
export function useReviewMap(): Record<string, ReviewRecord> {
  const s = useStore();
  return Object.fromEntries(s.reviews.map((r) => [r.taskId, r]));
}

/** Notifications raised by admin review decisions. */
export function useReviewNotifications(): ReviewNotification[] {
  return useStore().notifications;
}

/** Apply persisted decisions on top of the seeded tasks. */
export function applyReviewDecisions(list: Task[], map: Record<string, ReviewRecord>): Task[] {
  return list.map((t) => {
    const r = map[t.id];
    if (!r || r.decision === "remarks") return t;
    return {
      ...t,
      reviewState: r.decision,
      status: r.decision === "approved" ? ("completed" as const) : t.status,
      rejectionReason: r.decision === "rejected" ? r.remarks : t.rejectionReason,
    };
  });
}

export function submitReview(input: {
  task: Task;
  decision: ReviewDecision;
  remarks: string;
  reviewer: string;
}) {
  hydrate();
  const at = new Date().toISOString();
  const { task, decision, remarks, reviewer } = input;

  const record: ReviewRecord = { taskId: task.id, decision, remarks: remarks.trim(), reviewer, reviewedAt: at };

  const base: ReviewNotification = {
    id: `rv-${task.id}-${Date.now()}`,
    taskId: task.id,
    type: decision,
    title:
      decision === "approved" ? "Task approved"
      : decision === "rejected" ? "Changes requested"
      : "New remarks from reviewer",
    message:
      decision === "approved"
        ? `${reviewer} approved “${task.title}”.${remarks.trim() ? ` “${remarks.trim()}”` : ""}`
        : decision === "rejected"
          ? `“${task.title}” was rejected — ${remarks.trim() || "check reviewer notes"}.`
          : `${reviewer} left remarks on “${task.title}”: ${remarks.trim()}`,
    timestamp: at,
    state: "unread",
  };

  const notifications = [base, ...state.notifications];
  if (decision === "approved") {
    notifications.unshift({
      id: `rv-${task.id}-pts-${Date.now()}`,
      taskId: task.id,
      type: "points",
      title: "Points earned",
      message: `You earned ${task.points} points for “${task.title}”.`,
      points: task.points,
      timestamp: at,
      state: "unread",
    });
  }

  if (decision === "approved") {
    pushAdminNotif({
      type: "approved",
      title: "Task approved",
      message: `${reviewer} approved “${task.title}”.`,
      taskId: task.id,
    });
  }

  setState({
    // remarks don't close a review — keep the card in the queue
    reviews: decision === "remarks" ? state.reviews : [...state.reviews.filter((r) => r.taskId !== task.id), record],
    notifications,
  });
}

/** Drop any recorded decision for a task (used when an employee resubmits). */
export function clearReview(taskId: string) {
  hydrate();
  if (!state.reviews.some((r) => r.taskId === taskId)) return;
  setState({ ...state, reviews: state.reviews.filter((r) => r.taskId !== taskId) });
}

export function setReviewNotifState(id: string, next: ReviewNotifState) {

  hydrate();
  setState({
    ...state,
    notifications: state.notifications.map((n) => (n.id === id ? { ...n, state: next } : n)),
  });
}

export function bulkSetReviewNotifState(from: ReviewNotifState, to: ReviewNotifState) {
  hydrate();
  setState({
    ...state,
    notifications: state.notifications.map((n) => (n.state === from ? { ...n, state: to } : n)),
  });
}

export function removeReviewNotif(id: string) {
  hydrate();
  setState({ ...state, notifications: state.notifications.filter((n) => n.id !== id) });
}
