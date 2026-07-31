import { useSyncExternalStore } from "react";
import { employeeCode, nextAdminCode } from "@/lib/ids";
import { admins as seedAdmins, employees as seedEmployees, type Employee } from "@/lib/mock-data";
import { logAudit } from "@/lib/audit-log";

/**
 * Frontend-only account store. Holds accounts created from the admin panel
 * plus their mock login credentials, persisted to localStorage.
 * No backend — this is replaced by real auth later.
 */

export interface Credential {
  id: string;
  email: string;
  password: string;
  role: "admin" | "employee";
  code: string;
  name: string;
  avatar: string;
}

interface AccountState {
  employees: Employee[];
  admins: Employee[];
  credentials: Credential[];
}

const KEY = "dimisi-accounts";
/** Password every seeded demo account can sign in with. */
export const DEMO_PASSWORD = "Dimisi@2026";

const empty: AccountState = { employees: [], admins: [], credentials: [] };

const g = globalThis as unknown as { __dimisiAccounts?: AccountState };
let state: AccountState = g.__dimisiAccounts ?? empty;
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

function setState(next: AccountState) {
  state = next;
  g.__dimisiAccounts = next;
  persist();
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AccountState;
      state = {
        employees: parsed.employees ?? [],
        admins: parsed.admins ?? [],
        credentials: parsed.credentials ?? [],
      };
      g.__dimisiAccounts = state;
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

export function useAccounts() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** All employees = seeded mock data + accounts created in this browser. */
export function useAllEmployees(): Employee[] {
  const { employees } = useAccounts();
  return [...employees, ...seedEmployees].sort(
    (a, b) => +new Date(a.joinedAt) - +new Date(b.joinedAt),
  );
}

export function useAllAdmins(): Employee[] {
  const { admins } = useAccounts();
  return [...admins, ...seedAdmins].sort(
    (a, b) => +new Date(a.joinedAt) - +new Date(b.joinedAt),
  );
}

function allEmployees() {
  return [...state.employees, ...seedEmployees];
}
function allAdmins() {
  return [...state.admins, ...seedAdmins];
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** DMSEMPYYNN for a given joining date, sequenced across that joining year. */
export function nextEmployeeCode(joinedAt: string): string {
  const date = joinedAt || new Date().toISOString().slice(0, 10);
  const year = new Date(date).getFullYear();
  const count = allEmployees().filter((e) => new Date(e.joinedAt).getFullYear() === year).length;
  return employeeCode(date, count + 1);
}

/** DMSADMNN — never reuses a sequence already issued to a director or admin. */
export function nextAdminIdCode(): string {
  return nextAdminCode(allAdmins().map((a) => a.code));
}

export function emailTaken(email: string): boolean {
  const e = email.trim().toLowerCase();
  if (!e) return false;
  return (
    allEmployees().some((p) => p.email.toLowerCase() === e) ||
    allAdmins().some((p) => p.email.toLowerCase() === e)
  );
}

export interface NewAccountInput {
  name: string;
  email: string;
  password: string;
  department: string;
  jobTitle: string;
  joinedAt: string;
  phone?: string;
  about?: string;
  status: "active" | "inactive";
}

function toEmployee(input: NewAccountInput, code: string, role: "admin" | "employee"): Employee {
  return {
    id: `${role === "admin" ? "na" : "ne"}-${Date.now()}`,
    code,
    name: input.name.trim(),
    email: input.email.trim(),
    role,
    jobTitle: input.jobTitle,
    department: input.department,
    avatar: initials(input.name),
    points: 0,
    tasksCompleted: 0,
    status: input.status,
    joinedAt: input.joinedAt,
    phone: input.phone?.trim() || undefined,
    about: input.about?.trim() || undefined,
  };
}

import { pushAdminNotif } from "@/lib/admin-notification-store";

export function createEmployeeAccount(input: NewAccountInput): Employee {
  const person = toEmployee(input, nextEmployeeCode(input.joinedAt), "employee");
  setState({
    ...state,
    employees: [person, ...state.employees],
    credentials: [
      ...state.credentials,
      {
        id: person.id,
        email: person.email,
        password: input.password,
        role: "employee",
        code: person.code,
        name: person.name,
        avatar: person.avatar,
      },
    ],
  });
  logAudit({
    category: "employee",
    action: "Added Employee",
    target: person.name,
    targetId: person.code,
    details: `Employee account created${person.department ? ` for ${person.department}` : ""}.`,
  });
  pushAdminNotif({
    type: "new_employee",
    title: "New employee added",
    message: `${person.name} (${person.code}) was added${person.department ? ` to ${person.department}` : ""}.`,
  });
  return person;
}

export function createAdminAccount(input: NewAccountInput): Employee {
  const person = toEmployee(input, nextAdminIdCode(), "admin");
  setState({
    ...state,
    admins: [person, ...state.admins],
    credentials: [
      ...state.credentials,
      {
        id: person.id,
        email: person.email,
        password: input.password,
        role: "admin",
        code: person.code,
        name: person.name,
        avatar: person.avatar,
      },
    ],
  });
  logAudit({
    category: "admin",
    action: "Created Admin",
    target: person.name,
    targetId: person.code,
    details: "Admin account provisioned with management access.",
  });
  pushAdminNotif({
    type: "new_admin",
    title: "New admin added",
    message: `${person.name} (${person.code}) was provisioned with admin access.`,
  });
  return person;
}

export type SignInResult =
  | { ok: true; credential: Credential }
  | { ok: false; reason: "unknown_email" | "wrong_role" | "wrong_password" | "inactive" };

/**
 * OPEN ACCESS MODE — any email/password signs in to either portal.
 * Known accounts still resolve to their real identity; unknown ones get a
 * guest identity for the selected role. Remove when real auth lands.
 */
export const OPEN_ACCESS = true;

/** Mock credential check: seeded accounts use DEMO_PASSWORD, created ones their own. */
export function verifyCredentials(
  role: "admin" | "employee",
  email: string,
  password: string,
): SignInResult {
  hydrate();
  const e = email.trim().toLowerCase();

  const created = state.credentials.find((c) => c.email.toLowerCase() === e);
  const seedEmp = seedEmployees.find((p) => p.email.toLowerCase() === e);
  const seedAdm = seedAdmins.find((p) => p.email.toLowerCase() === e);
  const createdEmp = state.employees.find((p) => p.email.toLowerCase() === e);
  const createdAdm = state.admins.find((p) => p.email.toLowerCase() === e);

  const person =
    role === "admin" ? (createdAdm ?? seedAdm) : (createdEmp ?? seedEmp);

  if (!person) {
    if (OPEN_ACCESS) {
      const name = e.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "Guest User";
      const pretty = name.replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        ok: true,
        credential: {
          id: role === "admin" ? "guest-admin" : "guest-employee",
          email: email.trim(),
          password,
          role,
          code: role === "admin" ? "DMSADM00" : "DMSEMP0000",
          name: pretty,
          avatar: initials(pretty),
        },
      };
    }
    const existsOther = seedEmp || seedAdm || createdEmp || createdAdm;
    return { ok: false, reason: existsOther ? "wrong_role" : "unknown_email" };
  }

  if (!OPEN_ACCESS) {
    const expected = created && created.role === role ? created.password : DEMO_PASSWORD;
    if (password !== expected) return { ok: false, reason: "wrong_password" };
    if (person.status === "inactive") return { ok: false, reason: "inactive" };
  }

  return {
    ok: true,
    credential: {
      id: person.id,
      email: person.email,
      password,
      role,
      code: person.code,
      name: person.name,
      avatar: person.avatar,
    },
  };
}
