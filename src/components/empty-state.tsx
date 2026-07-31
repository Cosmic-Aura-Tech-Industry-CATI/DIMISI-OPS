import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="status"
      className="glass flex flex-col items-center justify-center rounded-2xl p-10 sm:p-14 text-center animate-in fade-in zoom-in-95 duration-500 motion-reduce:animate-none"
    >
      <div className="relative mb-5">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 rounded-2xl bg-primary/25 blur-2xl"
        />
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-border/60 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
          <Icon className="h-7 w-7 text-primary" />
        </div>
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
