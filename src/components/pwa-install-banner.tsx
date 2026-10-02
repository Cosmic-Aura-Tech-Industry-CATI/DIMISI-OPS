import { useState } from "react";
import { Download, X, Share2, PlusSquare, Sparkles } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { BRAND_MARK_SRC } from "@/lib/brand";

export function PwaInstallBanner() {
  const { canPromptNative, isInstalled, isDismissed, isIos, promptInstall, dismissPrompt } =
    usePwaInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);

  // If already installed or dismissed by user, do not render
  if (isInstalled || isDismissed) {
    return null;
  }

  // If browser does not support native prompt and is not iOS, do not render
  if (!canPromptNative && !isIos) {
    return null;
  }

  return (
    <aside
      aria-label="Install DIMISI OPS"
      className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="glass-strong rounded-2xl border border-primary/30 p-4 shadow-glass backdrop-blur-2xl">
        <div className="flex items-start gap-3">
          <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/30 bg-background/80 p-1">
            <img src={BRAND_MARK_SRC} alt="Dimisi Logo" className="h-full w-full object-contain" />
            <div className="absolute -top-1 -right-1">
              <span className="flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                Install DIMISI OPS
              </h3>
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-medium text-primary uppercase tracking-wider">
                PWA
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
              Install for instant access, desktop/mobile standalone mode, and seamless offline
              shell.
            </p>

            {showIosGuide && (
              <div className="mt-2.5 rounded-lg border border-border/80 bg-background/90 p-2 text-[11px] text-foreground space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-primary">
                  <Share2 className="h-3.5 w-3.5" /> 1. Tap Share in Safari
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <PlusSquare className="h-3.5 w-3.5" /> 2. Select &ldquo;Add to Home Screen&rdquo;
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              {canPromptNative ? (
                <button
                  type="button"
                  onClick={promptInstall}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-95 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="h-3.5 w-3.5" /> Install App
                </button>
              ) : isIos ? (
                <button
                  type="button"
                  onClick={() => setShowIosGuide((prev) => !prev)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-95"
                >
                  <Sparkles className="h-3.5 w-3.5" /> {showIosGuide ? "Got it" : "How to install"}
                </button>
              ) : null}

              <button
                type="button"
                onClick={dismissPrompt}
                className="rounded-lg border border-border/60 bg-background/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Not now
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissPrompt}
            aria-label="Dismiss install prompt"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
