import { cn } from "@/lib/utils";

/** Subtle monospace badge used to display standardized Employee / Admin IDs. */
export function IdBadge({ id, className }: { id: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-border/70 bg-secondary/40 px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider text-muted-foreground",
        className,
      )}
    >
      {id}
    </span>
  );
}
