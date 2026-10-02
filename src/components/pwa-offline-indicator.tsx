import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";

export function PwaOfflineIndicator() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-4 py-1.5 text-xs font-semibold text-black shadow-lg animate-in slide-in-from-top duration-300"
      >
        <WifiOff className="h-3.5 w-3.5 shrink-0" />
        <span>
          You are currently offline. Application shell is cached; live synchronization will resume
          when connected.
        </span>
      </div>
    );
  }

  if (showRestored) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg animate-in slide-in-from-top fade-out duration-300"
      >
        <Wifi className="h-3.5 w-3.5 shrink-0" />
        <span>Internet connection restored. Live operations active.</span>
      </div>
    );
  }

  return null;
}
