import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const BACKEND_URL = env.VITE_DEV_BACKEND_URL;
  const NGROK_HOST = env.VITE_NGROK_HOST;
  const VITE_ENV = env.VITE_ENV;
  const isProd = VITE_ENV === 'production';

  return {
    tanStackStart: {
      server: { entry: "server" },
    },
    server: {
      host: !isProd,
      allowedHosts: (!isProd && NGROK_HOST) ? [NGROK_HOST] : undefined,
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