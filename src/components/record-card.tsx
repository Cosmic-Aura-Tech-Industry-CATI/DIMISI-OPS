import type { ReactNode } from "react";

/**
 * Mobile-first representation of a data-table row.
 * Used below `md` so tables never require horizontal scrolling on phones.
 */
export function RecordCard({
  avatar,
  title,
  subtitle,
  badges,
  fields,
  actions,
  index = 0,
}: {
  avatar?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  fields?: { label: string; value: ReactNode }[];
  actions?: ReactNode;
  index?: number;
}) {
  return (
    <article
      className="animate-in fade-in slide-in-from-bottom-1 rounded-2xl border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/30 motion-reduce:animate-none"
      style={{ animationDelay: `${index * 25}ms` }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {avatar && <div className="shrink-0">{avatar}</div>}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{title}</div>
            {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      {badges && <div className="mt-3 flex flex-wrap items-center gap-2">{badges}</div>}

      {fields && fields.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/50 pt-3 text-xs">
          {fields.map((f) => (
            <div key={f.label} className="min-w-0">
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</dt>
              <dd className="mt-0.5 truncate font-medium">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}
