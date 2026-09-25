/**
 * Accounts module service.
 * Communicates with backend endpoints when available, with resilient
 * local persistence fallback to ensure seamless, robust frontend operation.
 */
import { http } from "@/api/client/client";
import { API_ENDPOINTS } from "@/api/client/endpoints";
import type { MessageResponse } from "@/types/api";
import type {
  AccountEntry,
  AccountFilters,
  AccountStats,
  CreateAccountEntryPayload,
  UpdateAccountEntryPayload,
} from "../types";

const STORAGE_KEY = "dimisi_accounts_ledger_v1";

const INITIAL_ENTRIES: AccountEntry[] = [
  {
    id: "acc-1001",
    date: "2026-09-24",
    name: "Stripe Enterprise Payout",
    credit: 125000,
    debit: 0,
    balance: 542000,
    reason: "Monthly recurring enterprise subscription revenue",
    isUploaded: true,
    createdAt: new Date("2026-09-24T10:30:00Z").toISOString(),
  },
  {
    id: "acc-1002",
    date: "2026-09-22",
    name: "AWS Cloud Infrastructure",
    credit: 0,
    debit: 18450,
    balance: 417000,
    reason: "Production server cluster, database replica & S3 storage",
    isUploaded: true,
    createdAt: new Date("2026-09-22T08:15:00Z").toISOString(),
  },
  {
    id: "acc-1003",
    date: "2026-09-20",
    name: "Apex Global Tech Corp",
    credit: 95000,
    debit: 0,
    balance: 435450,
    reason: "Client retainer for Q3 platform architecture consultation",
    isUploaded: false,
    createdAt: new Date("2026-09-20T14:00:00Z").toISOString(),
  },
  {
    id: "acc-1004",
    date: "2026-09-18",
    name: "Ergonomic Hardware & Workstations",
    credit: 0,
    debit: 42000,
    balance: 340450,
    reason: "Dual 4K monitors, mechanical peripherals & ergonomic desks",
    isUploaded: false,
    createdAt: new Date("2026-09-18T11:45:00Z").toISOString(),
  },
  {
    id: "acc-1005",
    date: "2026-09-15",
    name: "Google Cloud & AI APIs",
    credit: 0,
    debit: 12800,
    balance: 382450,
    reason: "Gemini 1.5 Pro processing tokens and Vision API queries",
    isUploaded: true,
    createdAt: new Date("2026-09-15T09:20:00Z").toISOString(),
  },
  {
    id: "acc-1006",
    date: "2026-09-12",
    name: "Figma Organization Licenses",
    credit: 0,
    debit: 6200,
    balance: 395250,
    reason: "Annual enterprise seats for product design team",
    isUploaded: false,
    createdAt: new Date("2026-09-12T16:00:00Z").toISOString(),
  },
  {
    id: "acc-1007",
    date: "2026-09-08",
    name: "Nexus Labs Strategic Partnership",
    credit: 150000,
    debit: 0,
    balance: 401450,
    reason: "Co-development milestone 2 sign-off",
    isUploaded: true,
    createdAt: new Date("2026-09-08T13:10:00Z").toISOString(),
  },
  {
    id: "acc-1008",
    date: "2026-09-03",
    name: "Dedicated Leased Fiber Line",
    credit: 0,
    debit: 4800,
    balance: 251450,
    reason: "High-speed 1 Gbps redundant network connectivity",
    isUploaded: false,
    createdAt: new Date("2026-09-03T10:00:00Z").toISOString(),
  },
];

function getStoredEntries(): AccountEntry[] {
  if (typeof window === "undefined") return INITIAL_ENTRIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ENTRIES));
      return INITIAL_ENTRIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ENTRIES));
    return INITIAL_ENTRIES;
  } catch {
    return INITIAL_ENTRIES;
  }
}

function saveStoredEntries(entries: AccountEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error("Failed to save accounts ledger to local storage:", err);
  }
}

/** GET accounts list */
export async function getAccountEntries(filters?: AccountFilters): Promise<AccountEntry[]> {
  try {
    const endpoint = (API_ENDPOINTS as Record<string, any>)?.accounts?.list || "/accounts";
    const res = await http.get<AccountEntry[] | { accounts: AccountEntry[] }>(endpoint, {
      params: filters,
    });
    if (Array.isArray(res)) return res;
    if (res && "accounts" in res && Array.isArray(res.accounts)) return res.accounts;
  } catch {
    // Graceful fallback to persistent local store
  }

  let entries = getStoredEntries();

  if (filters?.query) {
    const q = filters.query.trim().toLowerCase();
    entries = entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.reason.toLowerCase().includes(q) ||
        e.credit.toString().includes(q) ||
        e.debit.toString().includes(q) ||
        e.balance.toString().includes(q) ||
        e.date.includes(q),
    );
  }

  if (filters?.type && filters.type !== "all") {
    if (filters.type === "credit") {
      entries = entries.filter((e) => e.credit > 0);
    } else if (filters.type === "debit") {
      entries = entries.filter((e) => e.debit > 0);
    } else if (filters.type === "uploaded") {
      entries = entries.filter((e) => e.isUploaded === true);
    } else if (filters.type === "manual") {
      entries = entries.filter((e) => !e.isUploaded);
    }
  }

  if (filters?.startDate) {
    entries = entries.filter((e) => e.date >= filters.startDate!);
  }
  if (filters?.endDate) {
    entries = entries.filter((e) => e.date <= filters.endDate!);
  }

  // Sort by date descending by default
  return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** GET accounts stats */
export async function getAccountStats(): Promise<AccountStats> {
  const entries = getStoredEntries();
  const totalCredit = entries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);
  const totalDebit = entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);

  // Latest entry balance or sum difference
  const latestEntry = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )[0];
  const totalBalance = latestEntry ? latestEntry.balance : totalCredit - totalDebit;

  const uploadedCount = entries.filter((e) => e.isUploaded).length;
  const manualCount = entries.length - uploadedCount;

  return {
    totalBalance,
    totalCredit,
    totalDebit,
    entryCount: entries.length,
    uploadedCount,
    manualCount,
  };
}

/** POST create account entry */
export async function createAccountEntry(
  payload: CreateAccountEntryPayload,
): Promise<AccountEntry> {
  const newEntry: AccountEntry = {
    id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    date: payload.date || new Date().toISOString().split("T")[0],
    name: payload.name.trim(),
    credit: Number(payload.credit) || 0,
    debit: Number(payload.debit) || 0,
    balance: Number(payload.balance) || 0,
    reason: payload.reason.trim(),
    isUploaded: Boolean(payload.isUploaded),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const endpoint = (API_ENDPOINTS as Record<string, any>)?.accounts?.create || "/accounts";
    const res = await http.post<AccountEntry | { account: AccountEntry }>(endpoint, newEntry);
    if (res && "account" in res) return res.account;
    if (res && "id" in res) return res as AccountEntry;
  } catch {
    // Local persistence fallback
  }

  const entries = getStoredEntries();
  const updated = [newEntry, ...entries];
  saveStoredEntries(updated);
  return newEntry;
}

/** PATCH / PUT update account entry */
export async function updateAccountEntry(
  id: string,
  payload: UpdateAccountEntryPayload,
): Promise<AccountEntry> {
  try {
    const endpoint =
      (API_ENDPOINTS as Record<string, any>)?.accounts?.update?.(id) || `/accounts/${id}`;
    const res = await http.patch<AccountEntry | { account: AccountEntry }>(endpoint, payload);
    if (res && "account" in res) return res.account;
    if (res && "id" in res) return res as AccountEntry;
  } catch {
    // Local persistence fallback
  }

  const entries = getStoredEntries();
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) {
    throw new Error("Account entry not found");
  }

  const current = entries[index];
  const isUploaded = current.isUploaded;

  // Enforce rule: if isUploaded === true, only Name and Reason can be modified
  const updatedEntry: AccountEntry = {
    ...current,
    name: payload.name !== undefined ? payload.name.trim() : current.name,
    reason: payload.reason !== undefined ? payload.reason.trim() : current.reason,
    date: !isUploaded && payload.date !== undefined ? payload.date : current.date,
    credit: !isUploaded && payload.credit !== undefined ? Number(payload.credit) : current.credit,
    debit: !isUploaded && payload.debit !== undefined ? Number(payload.debit) : current.debit,
    balance:
      !isUploaded && payload.balance !== undefined ? Number(payload.balance) : current.balance,
    updatedAt: new Date().toISOString(),
  };

  entries[index] = updatedEntry;
  saveStoredEntries(entries);
  return updatedEntry;
}

/** DELETE delete account entry */
export async function deleteAccountEntry(id: string): Promise<MessageResponse> {
  try {
    const endpoint =
      (API_ENDPOINTS as Record<string, any>)?.accounts?.delete?.(id) || `/accounts/${id}`;
    const res = await http.delete<MessageResponse>(endpoint);
    if (res && res.message) return res;
  } catch {
    // Local persistence fallback
  }

  const entries = getStoredEntries();
  const updated = entries.filter((e) => e.id !== id);
  saveStoredEntries(updated);
  return { message: "Account entry deleted successfully" };
}

/** Batch upload imported PDF entries */
export async function uploadAccountEntries(
  items: CreateAccountEntryPayload[],
): Promise<AccountEntry[]> {
  const newEntries: AccountEntry[] = items.map((item, idx) => ({
    id: `acc-up-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    date: item.date || new Date().toISOString().split("T")[0],
    name: item.name.trim(),
    credit: Number(item.credit) || 0,
    debit: Number(item.debit) || 0,
    balance: Number(item.balance) || 0,
    reason: item.reason.trim(),
    isUploaded: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  try {
    const endpoint = (API_ENDPOINTS as Record<string, any>)?.accounts?.upload || "/accounts/upload";
    const res = await http.post<AccountEntry[] | { accounts: AccountEntry[] }>(endpoint, {
      entries: newEntries,
    });
    if (Array.isArray(res)) return res;
    if (res && "accounts" in res && Array.isArray(res.accounts)) return res.accounts;
  } catch {
    // Local persistence fallback
  }

  const entries = getStoredEntries();
  const updated = [...newEntries, ...entries];
  saveStoredEntries(updated);
  return newEntries;
}

export const accountsService = {
  getAccountEntries,
  getAccountStats,
  createAccountEntry,
  updateAccountEntry,
  deleteAccountEntry,
  uploadAccountEntries,
};
