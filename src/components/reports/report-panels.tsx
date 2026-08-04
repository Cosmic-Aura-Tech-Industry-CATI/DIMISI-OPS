import type { ReactNode } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Glass card wrapping a chart, with a title block and optional right-hand slot. */
export function ChartPanel({
  title,
  subtitle,
  aside,
  dense,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  subtitle: string;
  aside?: ReactNode;
  /** Compact header (no flex row) used by the secondary charts. */
  dense?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("glass rounded-2xl p-6", className)}>
      {dense && !aside ? (
        <div className="mb-2">
          <PanelTitle title={title} subtitle={subtitle} />
        </div>
      ) : (
        <div className="mb-4 flex items-start justify-between">
          <div>
            <PanelTitle title={title} subtitle={subtitle} />
          </div>
          {aside}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </>
  );
}

/** Glass card wrapping a data table, with a header row and download action. */
export function TablePanel({
  title,
  subtitle,
  onDownload,
  children,
}: {
  title: string;
  subtitle: string;
  onDownload: () => void;
  children: ReactNode;
}) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div>
          <h3 className="font-display text-base font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-md" onClick={onDownload}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Download
        </Button>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

/** Gradient completion bar with a right-aligned percentage label. */
export function CompletionMeter({ rate }: { rate: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs text-muted-foreground">{rate}%</span>
    </div>
  );
}

/** Small colour dot used in table cells and chart legends. */
export function ColorDot({ color }: { color: string }) {
  return <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />;
}
