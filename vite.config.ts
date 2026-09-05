import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

const BACKEND_URL = process.env.VITE_DEV_BACKEND_URL || "http://127.0.0.1:5000";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      proxy: {
        "/api": {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy) => {
            proxy.on("error", (err, _req, res) => {
              console.warn("[vite proxy warning]", err.message);
              if (res && "writeHead" in res && typeof (res as any).writeHead === "function") {
                (res as any).writeHead(502, { "Content-Type": "application/json" });
                (res as any).end(
                  JSON.stringify({
                    status: 502,
                    error: "Bad Gateway",
                    message: `Backend server is unreachable at ${BACKEND_URL}. Ensure dimisi-ops-backend is running on port 5000.`,
                  }),
                );
              }
            });
          },
        },
      },
    },
  },
});

