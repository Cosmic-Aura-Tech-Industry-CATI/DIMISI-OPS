import { useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { passwordRules, passwordScore, strengthLabel } from "@/lib/password";

export const DESIGNATIONS = [
  "Frontend Developer",
  "Backend Developer",
  "UI Designer",
  "QA Tester",
  "Market Researcher",
];

export const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Marketing",
  "Sales",
  "Support",
  "Product",
  "Operations",
  "People",
];

export function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="card-title border-b border-border/60 pb-2 text-sm font-semibold tracking-tight">
      {children}
    </h2>
  );
}

export function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete = "new-password",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function PasswordStrength({ value }: { value: string }) {
  const score = passwordScore(value);
  return (
    <div className="space-y-2 rounded-md border border-border/60 bg-card/40 p-3">
      <div className="flex items-center justify-between text-[11px]">
        <span className="uppercase tracking-wider text-muted-foreground">Strength</span>
        <span className={cn("font-medium", score >= 5 ? "text-primary" : "text-muted-foreground")}>
          {value ? strengthLabel(score) : "—"}
        </span>
      </div>
      <div className="flex gap-1">
        {passwordRules.map((r, i) => (
          <span
            key={r.id}
            className={cn(
              "h-1 flex-1 rounded-sm transition-colors",
              i < score ? "bg-primary" : "bg-border/70",
            )}
          />
        ))}
      </div>
      <ul className="grid gap-1 pt-1 sm:grid-cols-2">
        {passwordRules.map((r) => {
          const ok = r.test(value);
          return (
            <li
              key={r.id}
              className={cn(
                "flex items-center gap-1.5 text-[11px]",
                ok ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {ok ? (
                <Check className="h-3 w-3 text-primary" />
              ) : (
                <X className="h-3 w-3 opacity-60" />
              )}
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
