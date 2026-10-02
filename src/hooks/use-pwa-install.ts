import { useState, useEffect, useCallback } from "react";

const DISMISS_KEY = "dimisi_pwa_install_dismissed_v1";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(true);
  const [isIos, setIsIos] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if running in standalone mode (already installed PWA)
    const nav = navigator as unknown as { standalone?: boolean };
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true ||
      document.referrer.includes("android-app://");

    setIsInstalled(isStandalone);

    // Check iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIos(isIosDevice);

    // Check dismissal status in localStorage
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed) {
        const parsedTime = parseInt(dismissed, 10);
        // If dismissed within the last 14 days, keep dismissed
        if (Date.now() - parsedTime < 14 * 24 * 60 * 60 * 1000) {
          setIsDismissed(true);
        } else {
          setIsDismissed(false);
        }
      } else {
        setIsDismissed(false);
      }
    } catch (e) {
      void e;
      setIsDismissed(false);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch (e) {
        void e;
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.warn("[PWA] Error showing install prompt:", err);
      return false;
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch (e) {
      void e;
    }
  }, []);

  const canInstall = !isInstalled && (deferredPrompt !== null || (isIos && !isDismissed));

  return {
    canInstall,
    canPromptNative: Boolean(deferredPrompt),
    isInstalled,
    isDismissed,
    isIos,
    promptInstall,
    dismissPrompt,
  };
}
