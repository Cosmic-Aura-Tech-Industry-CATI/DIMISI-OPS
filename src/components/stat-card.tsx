import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: number;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "info";
}

const accentMap: Record<NonNullable<StatCardProps["accent"]>, { grad: string; ring: string; icon: string }> = {
  primary: {
    grad: "from-primary/70 to-primary",
    ring: "shadow-[0_0_40px_-8px_rgb(255_255_255/0.18)]",
    icon: "bg-primary/15 text-primary",
  },
  success: {
    grad: "from-primary/70 to-primary",
    ring: "shadow-[0_0_40px_-8px_rgb(255_255_255/0.14)]",
    icon: "bg-primary/15 text-primary",
  },
  warning: {
    grad: "from-primary/70 to-primary",
    ring: "shadow-[0_0_40px_-8px_rgb(255_255_255/0.12)]",
    icon: "bg-primary/15 text-primary",
  },
  info: {
    grad: "from-primary/70 to-primary",
    ring: "shadow-[0_0_40px_-8px_rgb(255_255_255/0.10)]",
    icon: "bg-primary/15 text-primary",
  },
};

export function StatCard({ label, value, icon: Icon, delta, hint, accent = "primary" }: StatCardProps) {
  const positive = (delta ?? 0) > 0;
  const flat = delta === 0;
  const tone = accentMap[accent];
  return (
    <article
      className="glass hover-lift group relative overflow-hidden rounded-2xl p-5 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none"
      aria-label={`${label}: ${value}`}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-50",
          tone.grad,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground [overflow-wrap:normal]" title={label}>{label}</p>
          <p className="mt-2 truncate font-sans text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110",
            tone.icon,
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {delta !== undefined && (
        <div className="relative mt-4 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium",
              flat && "bg-muted text-muted-foreground",
              !flat && positive && "bg-primary/15 text-primary",
              !flat && !positive && "bg-destructive/15 text-destructive",
            )}
          >
            {flat ? (
              <Minus className="h-3 w-3" />
            ) : positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(delta)}%
          </span>
          <span className="text-muted-foreground">vs last week</span>
        </div>
      )}
    </article>
  );
}
