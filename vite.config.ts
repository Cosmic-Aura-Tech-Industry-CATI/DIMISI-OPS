import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawBackendUrl = env.VITE_DEV_BACKEND_URL || "http://127.0.0.1:5000";
  const NGROK_HOST = env.VITE_NGROK_HOST;
  const VITE_ENV = env.VITE_ENV;
  const isProd = VITE_ENV === 'production';

  let targetUrl = rawBackendUrl;
  try {
    const parsed = new URL(rawBackendUrl);
    if (parsed.pathname.startsWith('/api')) {
      targetUrl = parsed.origin;
    }
  } catch {
    targetUrl = rawBackendUrl;
  }

  console.log(`[vite config] Proxy target configured as: ${targetUrl} (from VITE_DEV_BACKEND_URL=${rawBackendUrl})`);

  return {
    tanStackStart: {
      server: { entry: "server" },
    },
    server: {
      host: !isProd,
      allowedHosts: (!isProd && NGROK_HOST) ? [NGROK_HOST] : undefined,
      proxy: {
        '/api': {
          target: targetUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy, _options) => {
            proxy.on("proxyReq", (_proxyReq, req) => {
              console.log(`[vite proxy] Forwarding ${req.method} ${req.url} -> ${targetUrl}${req.url}`);
            });
            proxy.on("error", (err, _req, res) => {
              console.warn("[vite proxy warning]", err.message);
              if (res && typeof (res as any).writeHead === "function") {
                (res as any).writeHead(502, { "Content-Type": "application/json" });
                (res as any).end(
                  JSON.stringify({
                    status: 502,
                    error: "Bad Gateway",
                    message: `Backend server is unreachable at ${targetUrl}. Ensure backend is running.`
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