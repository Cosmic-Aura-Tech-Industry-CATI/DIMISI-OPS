// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const BACKEND_URL = env.VITE_DEV_BACKEND_URL;

  return {
    tanStackStart: {
      server: { entry: "server" },
    },
    server: {
      proxy: {
        '/api': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, res) => {
              console.warn("[vite proxy warning]", err.message);
              if (res && typeof (res as any).writeHead === "function") {
                (res as any).writeHead(502, { "Content-Type": "application/json" });
                (res as any).end(
                  JSON.stringify({
                    status: 502,
                    error: "Bad Gateway",
                    message: `Backend server is unreachable at ${BACKEND_URL}. Ensure dimisi-ops-backend is running.`
                  })
                );
              }
            });
          }
        }
      }
    }
  };
});