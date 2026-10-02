/**
 * DIMISI OPS — Service Worker Client Registration
 */

export function registerServiceWorker(
  onUpdate?: (registration: ServiceWorkerRegistration) => void,
) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // Check for updates on register
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) return;

          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // New content is available; trigger update callback
                if (onUpdate) onUpdate(registration);
              }
            }
          });
        });
      })
      .catch((error) => {
        console.warn("[PWA] Service Worker registration failed:", error);
      });
  });
}
