import { useEffect, useState } from "react";
import { registerServiceWorker } from "@/lib/pwa-service-worker";
import { PwaInstallBanner } from "./pwa-install-banner";
import { PwaOfflineIndicator } from "./pwa-offline-indicator";
import { RefreshCw } from "lucide-react";

export function PwaController() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    registerServiceWorker((registration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowUpdatePrompt(true);
      }
    });

    // Listen for controlling service worker changes (reload to activate new version)
    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    }

    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      }
    };
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    setShowUpdatePrompt(false);
  };

  return (
    <>
      <PwaOfflineIndicator />
      <PwaInstallBanner />

      {showUpdatePrompt && (
        <aside
          aria-label="App update available"
          className="fixed bottom-4 left-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="glass-strong rounded-2xl border border-primary/40 p-4 shadow-glass backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-foreground">Update Available</div>
                <div className="text-[11px] text-muted-foreground">
                  A new version of DIMISI OPS is ready.
                </div>
              </div>
              <button
                type="button"
                onClick={handleUpdate}
                className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-95"
              >
                Reload
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
