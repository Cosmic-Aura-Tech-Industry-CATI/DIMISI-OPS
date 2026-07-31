import { AlertTriangle, RefreshCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this section. Please try again in a moment.",
  onRetry,
  action,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="glass flex flex-col items-center justify-center rounded-2xl p-10 sm:p-14 text-center animate-in fade-in zoom-in-95 duration-300 motion-reduce:animate-none"
    >
      <div className="relative mb-5">
        <div aria-hidden className="absolute inset-0 -z-10 rounded-2xl bg-destructive/20 blur-2xl" />
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{description}</p>
      {(onRetry || action) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="rounded-md">
              <RefreshCcw className="mr-2 h-4 w-4" /> Try again
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
