import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
const BACKEND_URL = env.VITE_DEV_BACKEND_URL || process.env.VITE_DEV_BACKEND_URL || "https://api.dimisi.tech";

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
          configure: (proxy: any) => {
            proxy.on("error", (err: any, _req: any, res: any) => {
              console.warn("[vite proxy warning]", err.message);
              if (res && "writeHead" in res && typeof (res as any).writeHead === "function") {
                (res as any).writeHead(502, { "Content-Type": "application/json" });
                (res as any).end(
                  JSON.stringify({
                    status: 502,
                    error: "Bad Gateway",
                    message: `Backend server is unreachable at ${BACKEND_URL}. Ensure dimisi-ops-backend is running.`,
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



