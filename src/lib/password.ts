/** Frontend-only password rules used by the account creation flow. */

export interface PasswordRule {
  id: string;
  label: string;
  test: (v: string) => boolean;
}

export const passwordRules: PasswordRule[] = [
  { id: "len", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "num", label: "One number", test: (v) => /\d/.test(v) },
  { id: "special", label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function passwordScore(v: string): number {
  return passwordRules.filter((r) => r.test(v)).length;
}

export function isStrongPassword(v: string): boolean {
  return passwordScore(v) === passwordRules.length;
}

export function strengthLabel(score: number): string {
  if (score <= 1) return "Very weak";
  if (score === 2) return "Weak";
  if (score === 3) return "Fair";
  if (score === 4) return "Strong";
  return "Excellent";
}
