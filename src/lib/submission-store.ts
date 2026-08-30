import { useSyncExternalStore } from "react";
import type { Task } from "@/features/tasks";

/**
 * Frontend-only submission store. Holds the employee "Task Submission"
 * workflow: drafts (saved progress, task stays in progress) and submitted
 * proof packages awaiting admin review. Persisted to localStorage — no backend.
 */

export interface SubmissionFile {
  id: string;
  name: string;
  size: number;
  type: string;
  /** Inlined data for small files so admins can download the proof. */
  dataUrl?: string;
}

export interface SubmissionChecklist {
  completed: boolean;
  proof: boolean;
  verified: boolean;
}

export interface Submission {
  taskId: string;
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  issues: string;
  files: SubmissionFile[];
  checklist: SubmissionChecklist;
  status: "draft" | "submitted";
  updatedAt: string;
  submittedAt?: string;
}

const KEY = "dimisi-submissions";
const empty: Submission[] = [];

const g = globalThis as unknown as { __dimisiSubmissions?: Submission[] };
let state: Submission[] = g.__dimisiSubmissions ?? empty;
let hydrated = false;
const listeners = new Set<() => void>();

function setState(next: Submission[]) {
  state = next;
  g.__dimisiSubmissions = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // quota exceeded — retry without inlined file payloads
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify(next.map((s) => ({ ...s, files: s.files.map(({ dataUrl: _d, ...f }) => f) }))),
      );
    } catch {}
  }
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      state = JSON.parse(raw) as Submission[];
      g.__dimisiSubmissions = state;
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

export function useSubmissions(): Submission[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Submissions keyed by task id. */
export function useSubmissionMap(): Record<string, Submission> {
  const list = useSubmissions();
  return Object.fromEntries(list.map((s) => [s.taskId, s]));
}

export function getSubmission(taskId: string): Submission | undefined {
  hydrate();
  return state.find((s) => s.taskId === taskId);
}

export function useSubmission(taskId: string): Submission | undefined {
  return useSubmissions().find((s) => s.taskId === taskId);
}

function upsert(next: Submission) {
  hydrate();
  setState([...state.filter((s) => s.taskId !== next.taskId), next]);
}

export function saveDraft(input: Omit<Submission, "status" | "updatedAt" | "submittedAt">) {
  upsert({ ...input, status: "draft", updatedAt: new Date().toISOString() });
}

export function submitForReview(input: Omit<Submission, "status" | "updatedAt" | "submittedAt">) {
  const at = new Date().toISOString();
  upsert({ ...input, status: "submitted", updatedAt: at, submittedAt: at });
}

/**
 * Apply submitted packages on top of the task list so a submitted task leaves
 * "Assigned tasks" and lands in "Pending review".
 */
export function applySubmissions(list: Task[], map: Record<string, Submission>): Task[] {
  return list.map((t) => {
    const s = map[t.id];
    if (!s || s.status !== "submitted") return t;
    return { ...t, reviewState: "in_review" as const, rejectionReason: undefined };
  });
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** Download a proof file (falls back to a metadata stub when not inlined). */
export function downloadSubmissionFile(file: SubmissionFile) {
  const href =
    file.dataUrl ??
    URL.createObjectURL(
      new Blob(
        [
          `Proof placeholder\n\nFile: ${file.name}\nType: ${file.type}\nSize: ${formatFileSize(file.size)}\n\nThe original binary was too large to store in this demo environment.`,
        ],
        { type: "text/plain" },
      ),
    );
  const a = document.createElement("a");
  a.href = href;
  a.download = file.dataUrl ? file.name : `${file.name}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (!file.dataUrl) setTimeout(() => URL.revokeObjectURL(href), 1000);
}
