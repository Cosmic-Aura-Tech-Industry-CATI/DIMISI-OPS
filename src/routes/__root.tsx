import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { PwaController } from "@/components/pwa-controller";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(600px_circle_at_50%_30%,rgb(255_255_255_/_0.08),transparent_60%)]" />
      <div className="glass relative w-full max-w-lg rounded-3xl p-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-background/60 border border-border">
          <img src="/assets/dimisi-mark.png" alt="Dimisi" className="h-9 w-9 object-contain" />
        </div>
        <h1 className="mt-6 font-display text-7xl font-bold tracking-tight text-gradient">404</h1>
        <h2 className="mt-3 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist, was moved, or is temporarily unavailable.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
          >
            Back to home
          </a>
          <a
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background/60 px-5 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Open dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-3xl p-10 text-center">
        <h1 className="font-display text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-md border border-border bg-background/60 px-4 py-2 text-sm font-medium"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
      },
      { title: "DIMISI OPS — Enterprise Operations Portal" },
      {
        name: "description",
        content:
          "DIMISI OPS is an enterprise task and employee operations management platform with role-based dashboards, points, and real-time insights.",
      },
      { name: "author", content: "Dimisi Technologies" },
      { property: "og:title", content: "DIMISI OPS — Enterprise Operations Portal" },
      {
        property: "og:description",
        content:
          "Enterprise employee operations, task workflows, performance tracking, and role-based portal by Dimisi Technologies.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/android-chrome-512x512.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "DIMISI OPS" },
      {
        name: "twitter:description",
        content: "Enterprise operations and employee task management platform.",
      },
      { name: "twitter:image", content: "/android-chrome-512x512.png" },

      // PWA & iOS Mobile Standalone Web App Meta
      { name: "theme-color", content: "#070707" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "DIMISI OPS" },
      { name: "application-name", content: "DIMISI OPS" },
      { name: "format-detection", content: "telephone=no" },
      { name: "msapplication-TileColor", content: "#070707" },
      { name: "msapplication-TileImage", content: "/android-chrome-192x192.png" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Serif+Display:ital@0;1&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
          <PwaController />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
