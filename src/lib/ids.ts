/**
 * Standardized Dimisi ID system.
 *
 * Employees : DMSEMP<YY><NN>  — YY = last two digits of joining year,
 *                               NN = sequence of employees who joined that year.
 * Directors : DMSDIR<NN>      — permanent, non-deletable system administrators.
 * Admins    : DMSADM<NN>      — dynamically created admins, sequence never reused.
 */

export const PERMANENT_ADMIN_IDS = ["DMSDIR01", "DMSDIR02", "DMSDIR03"] as const;

export function isPermanentAdmin(code: string | undefined): boolean {
  return !!code && (PERMANENT_ADMIN_IDS as readonly string[]).includes(code);
}

export function employeeCode(joinedAt: string, seq: number): string {
  const yy = String(new Date(joinedAt).getFullYear()).slice(-2);
  return `DMSEMP${yy}${String(seq).padStart(2, "0")}`;
}

export function adminCode(seq: number): string {
  return `DMSADM${String(seq).padStart(2, "0")}`;
}

/** Assigns employee codes by joining year, sequenced by joining date. */
export function assignEmployeeCodes<T extends { joinedAt: string }>(
  people: T[],
): (T & { code: string })[] {
  const perYear = new Map<number, number>();
  const ordered = [...people].sort((a, b) => +new Date(a.joinedAt) - +new Date(b.joinedAt));
  const codes = new Map<T, string>();
  for (const p of ordered) {
    const year = new Date(p.joinedAt).getFullYear();
    const seq = (perYear.get(year) ?? 0) + 1;
    perYear.set(year, seq);
    codes.set(p, employeeCode(p.joinedAt, seq));
  }
  return people.map((p) => ({ ...p, code: codes.get(p)! }));
}

/** Next dynamic admin ID — never reuses a previously issued sequence. */
export function nextAdminCode(existingCodes: string[]): string {
  const used = existingCodes
    .map((c) => /^DMS(?:ADM|DIR)(\d+)$/.exec(c)?.[1])
    .filter(Boolean)
    .map((n) => Number(n));
  const max = used.length ? Math.max(...used) : 3;
  return adminCode(max + 1);
}

/** Year options derived from a set of people, newest first. */
export function joiningYears<T extends { joinedAt: string }>(people: T[]): string[] {
  return Array.from(new Set(people.map((p) => String(new Date(p.joinedAt).getFullYear())))).sort(
    (a, b) => Number(b) - Number(a),
  );
}
