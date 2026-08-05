# Deployment Guide

---

## 1. Local development

```sh
node -v            # ≥ 20
npm install
npm run dev        # http://localhost:8080
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build (catches prerender/SSR errors early) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

Demo credentials: **any email + any password**, OTP **`123456`**.

---

## 2. Environment variables

None are required today. Create `.env` (git-ignored) when the backend lands:

```dotenv
# Client (must be VITE_ prefixed — these are public)
VITE_API_BASE_URL=https://api.dimisi.example.com
VITE_APP_ENV=production

# Server (never expose to the client)
DATABASE_URL=postgres://user:pass@host:5432/dimisi
JWT_SECRET=...
JWT_REFRESH_SECRET=...
RESEND_API_KEY=...
STORAGE_BUCKET=dimisi-proofs
```

Rules:

- ✅ Client values: `import.meta.env.VITE_*`.
- ✅ Server values: `process.env['X']` read **inside** a handler, never at module scope (env is injected at call time).
- ❌ Never commit `.env`.
- ❌ Never put a secret behind a `VITE_` prefix.

---

## 3. Production build

```sh
npm run build
npm run preview      # verify locally before shipping
```

The build targets an **edge/Worker runtime**. Consequences:

- No `child_process`, `sharp`, `canvas`, `puppeteer`, or native addons in server code.
- All npm packages are bundled at build time — there is no runtime module resolution.
- Never set `ssr.external` / `resolve.external` in `vite.config.ts`.

---

## 4. Deploying

### 4.1 Lovable (recommended default)

Use **Publish** in the Lovable editor. Stable URLs:

- `project--<project-id>.lovable.app` — production
- `project--<project-id>-dev.lovable.app` — latest preview build

These are immutable and safe to configure in external services (webhooks, cron).

### 4.2 Vercel

TanStack Start builds to a standard Node/edge output.

| Setting | Value |
| --- | --- |
| Framework preset | Other / Vite |
| Install command | `npm install` |
| Build command | `npm run build` |
| Output directory | as produced by the build (`.output` / `dist`) |
| Node version | 20.x |

Add every `VITE_*` and server variable under **Project → Settings → Environment
Variables** for each environment (Production / Preview / Development), then
redeploy — Vite inlines `VITE_*` at build time, so changing them requires a rebuild.

SPA fallback is handled by the framework adapter; do **not** add a manual
`rewrites` rule to `index.html` — that breaks SSR routes.

### 4.3 Other hosts

Any host that runs the framework's Node or Worker output works (Cloudflare
Workers, Netlify, Fly.io). Serve the built server entry; do not serve `dist/`
as a pure static folder unless you have disabled SSR.

---

## 5. Asset handling

- Put images in `src/assets/` and **import** them:
  ```ts
  import logo from "@/assets/dimisi-logo.png";
  ```
  Vite then fingerprints and rewrites the URL for every environment.
- `public/` is copied verbatim (only `robots.txt` today). Files there are **not**
  fingerprinted — use it only for files that need a fixed path.
- ❌ Never hardcode `/src/assets/...` or a bare `/logo.png` string in JSX.

### Logo handling

All brand assets are centralised in `src/lib/brand.ts`. Import from there:

```ts
import { BRAND_LOGO, BRAND_MARK } from "@/lib/brand";
```

This is what fixed the "logo missing after export/deploy" bug — any new surface
that shows the logo must go through `brand.ts` rather than a raw path.

---

## 6. Pre-deploy checklist

- [ ] `OPEN_ACCESS = false` in `src/lib/accounts.ts`
- [ ] `DEMO_OTP = null` in `src/lib/otp.ts`
- [ ] Demo credential hint removed from `src/routes/login.tsx`
- [ ] `npm run lint` clean
- [ ] `npm run build` succeeds with no warnings about externals
- [ ] `npm run build:dev` succeeds (catches prerender/SSR 401s)
- [ ] `npm run preview` smoke-tested: login → dashboard → task → submit
- [ ] Every route has a unique `head()` title + description
- [ ] Responsive check at 320 / 768 / 1280 / 1920 px
- [ ] Dark and light themes verified
- [ ] All env vars set in the hosting dashboard

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Logo/image 404 in production | Hardcoded path instead of an import | Import from `src/lib/brand.ts` |
| Blank page, `localStorage is not defined` | Browser API read during SSR | Move to `useEffect` or a hydration guard |
| Hydration mismatch warning | `typeof window` check in a `useState` initializer | Read after mount instead |
| `build:dev exited with code 1` + `Unauthorized` | Protected server fn called from a public route loader | Move the call into the component/`useQuery` |
| `[unenv] X is not implemented yet!` | Node-only API in Worker runtime | Use a Worker-compatible library |
| `__dirname is not defined` | Node CommonJS package bundled for edge | Replace the dependency |
| Works in dev, fails in prod | Dev runs on Node without Worker constraints | Always test `npm run build && npm run preview` |
| `VITE_*` change has no effect | Inlined at build time | Redeploy after changing env vars |
| Duplicate `/` route error | A second index route exists | Keep only `src/routes/index.tsx` |
| Styles missing after adding a font | Remote `@import` in `styles.css` | Load fonts via `<link>` in `__root.tsx` |

---

## 8. Environment configuration matrix

| Environment | API base | OPEN_ACCESS | DEMO_OTP | Source maps |
| --- | --- | --- | --- | --- |
| Local | `http://localhost:3000/api` | `true` | `123456` | on |
| Preview | staging API | `false` | `null` | on |
| Production | production API | `false` | `null` | off |
