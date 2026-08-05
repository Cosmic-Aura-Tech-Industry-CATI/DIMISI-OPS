# Dimisi Employee & Task Management System — Developer Documentation

> **Status:** Frontend complete · Backend pending
> **Codename:** `Poll` (internal) → branded as **Dimisi Technologies**

---

## 1. Project Name

**Dimisi Employee Management System (Dimisi EMS)**

## 2. Project Description

A modern enterprise-grade task and workforce management platform with two fully
separated portals:

| Portal | Base route | Audience |
| --- | --- | --- |
| **Admin Panel** | `/admin` | Directors, admins, managers |
| **Employee Panel** | `/employee` | Employees / contributors |

Admins create employees, admins, projects and tasks; employees pick up or receive
tasks, submit proof of work, and earn points that feed a leaderboard. Every
mutation is written to an audit trail.

## 3. Purpose

- Centralise task distribution (universal, project-scoped, direct assignment).
- Provide a verifiable proof-of-work → review → approval pipeline.
- Gamify delivery through a points and leaderboard system.
- Give administrators full analytics, notices, notifications and audit logs.

## 4. Technology Stack

| Layer | Technology |
| --- | --- |
| Framework | **TanStack Start v1** (React 19 full-stack, SSR-capable) |
| Router | **TanStack Router** (file-based, `src/routes/`) |
| Build tool | **Vite 7** |
| Language | **TypeScript** (strict) |
| Styling | **Tailwind CSS v4** via `src/styles.css` (`@theme` tokens) |
| UI primitives | **shadcn/ui** on Radix UI (`src/components/ui/`) |
| Icons | **lucide-react** |
| Charts | **Recharts** |
| Forms | **react-hook-form** + **zod** (`@hookform/resolvers`) |
| Data/cache | **@tanstack/react-query** (QueryClient wired in `src/router.tsx`) |
| Toasts | **sonner** |
| Dates | **date-fns** |
| Persistence (current) | **localStorage** stores under `src/lib/*-store.ts` |

> ⚠️ **Note:** This project uses TanStack Start, **not** Next.js. Do not add
> `react-router-dom`, `src/pages/`, or `app/layout.tsx`.

## 5. Current Development Status

| Area | Status |
| --- | --- |
| Design system / theming | ✅ Complete (Gold & Black luxury editorial) |
| Routing (all modules) | ✅ Complete |
| Responsive 320px → 1920px+ | ✅ Complete |
| Mock data + local stores | ✅ Complete |
| Auth (mock + OTP) | ✅ Complete as mock |
| Real backend / database | ❌ Pending |
| Real email delivery (OTP) | ❌ Pending |
| File storage for proofs | ❌ Pending (currently in-memory/base64) |
| Server-side authorization | ❌ Pending |

### 5.1 Frontend Completion Status

- [x] Auth: login, role selection, OTP second factor, forgot/reset password
- [x] Admin dashboard with KPI cards + charts
- [x] Employee dashboard with hero + performance trend
- [x] Employees CRUD + detail/edit + ID system
- [x] Admins CRUD + permanent-director protection
- [x] Departments & designations (correlated dropdowns)
- [x] Projects module (`DMSPRJxxx`)
- [x] Tasks (universal / project / direct) + first-come-first-served pickup
- [x] Task submission with multi-file proof uploader (20 MB)
- [x] Admin review centre (approve / reject / remarks)
- [x] Notice board (admin CRUD + pin, employee read-only)
- [x] Leaderboard (both panels)
- [x] Reports (employee, task, project, department tabs + export)
- [x] Audit logs with CSV / Excel / PDF export
- [x] Notifications (role-aware, 30-day expiry)
- [x] Profile (bio + avatar editable only)
- [x] Settings incl. OTP-protected password change

### 5.2 Backend Pending Features

- [ ] Real authentication (JWT/session), refresh tokens, logout invalidation
- [ ] Server-generated + emailed OTP (currently `DEMO_OTP = "123456"`)
- [ ] Persistent database for all entities (see `DATABASE_SCHEMA.md`)
- [ ] File/object storage for proof uploads and avatars
- [ ] Server-side RBAC + protected route middleware
- [ ] Server-side pagination, search and filtering for large tables
- [ ] Real-time notifications (WebSocket / SSE / polling)
- [ ] Scheduled jobs: notification expiry, report snapshots, leaderboard rollups

## 6. Major Features

| Module | Description | Key files |
| --- | --- | --- |
| Authentication | Role-picked login, mock credential check, OPEN_ACCESS dev bypass | `src/lib/accounts.ts`, `src/lib/auth.tsx`, `src/routes/login.tsx` |
| OTP | Mandatory 6-digit second factor + separate channels for password change and recovery | `src/lib/otp.ts`, `password-otp.ts`, `recovery-otp.ts`, `src/components/otp-verification.tsx` |
| Dashboard | KPI cards, charts, quick actions | `src/routes/admin.index.tsx`, `src/components/admin-dashboard/*`, `src/routes/employee.index.tsx` |
| Employees | List, detail, create, edit, delete, statistics | `src/routes/admin.employees.*` |
| Admins | List, detail, create, edit; permanent directors undeletable | `src/routes/admin.admins.*` |
| Departments | Departments with nested designations, correlated dropdowns | `src/lib/department-store.ts`, `src/routes/admin.departments.tsx` |
| Projects | `DMSPRJxxx` IDs, CRUD, deletion guards | `src/lib/project-store.ts`, `src/routes/admin.projects.tsx` |
| Tasks | Universal / project / direct; pickup; detail dialog | `src/lib/task-store.ts`, `src/components/task-form.tsx`, `available-tasks.tsx` |
| Task Reviews | Approve / reject / remarks; queue removal; points award | `src/lib/review-store.ts`, `src/routes/admin.task-reviews.tsx` |
| Submissions | Proof upload (multi-format, 20 MB), checklist, detail dialog | `src/lib/submission-store.ts`, `src/routes/employee.tasks.$id.submit.tsx` |
| Reports | Employee/task/project/department analytics + export | `src/routes/admin.reports.tsx`, `src/components/reports/*` |
| Notice Board | Admin CRUD + pinning, employee read-only | `src/lib/notice-store.ts`, `src/components/notices/*` |
| Leaderboard | Points ranking for both panels | `src/routes/*.leaderboard.tsx` |
| Audit Logs | Every mutation logged + CSV/Excel/PDF export | `src/lib/audit-log.ts`, `src/lib/audit-export.ts` |
| Notifications | Role-aware feeds, 30-day auto expiry | `src/lib/admin-notification-store.ts`, `src/components/notifications-menu.tsx` |
| Profile | Bio + avatar editable; admin-owned fields read-only | `src/lib/profile-store.ts`, `src/components/edit-profile-dialog.tsx` |
| Settings | Preferences + OTP-protected password change | `src/routes/*.settings.tsx`, `src/components/change-password-card.tsx` |

## 7. Folder Structure

```text
.
├── docs/                          # ← this documentation
├── public/
│   └── robots.txt
├── src/
│   ├── assets/                    # Logo/mark image assets
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives (button, dialog, table…)
│   │   ├── admin-dashboard/       # Dashboard widgets, charts, quick actions
│   │   ├── notices/               # Notice composer, cards, filters, dialogs
│   │   ├── reports/               # Report tabs, chart theme, toolbar, hook
│   │   └── *.tsx                  # Shared app components (see COMPONENTS.md)
│   ├── hooks/
│   │   └── use-mobile.tsx         # Viewport breakpoint hook
│   ├── lib/                       # Domain logic, stores, utilities
│   ├── routes/                    # File-based routes (see ROUTES.md)
│   │   ├── __root.tsx             # App shell: providers, head, 404
│   │   ├── index.tsx              # Landing / redirect
│   │   ├── login.tsx              # Auth entry (+ OTP step)
│   │   ├── admin.*.tsx            # Admin panel routes
│   │   └── employee.*.tsx         # Employee panel routes
│   ├── routeTree.gen.ts           # AUTO-GENERATED — never edit
│   ├── router.tsx                 # Router + QueryClient factory
│   ├── server.ts / start.ts       # Start entrypoints
│   └── styles.css                 # Tailwind v4 theme tokens + global classes
├── components.json                # shadcn config
├── eslint.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

### 7.1 Folder responsibilities

| Folder | Responsibility |
| --- | --- |
| `src/routes` | One file per URL. Route files stay thin: layout + composition. |
| `src/components/ui` | Unmodified-by-default shadcn primitives. Avoid business logic here. |
| `src/components` | App-specific reusable components. |
| `src/lib` | All domain logic: stores, ID generation, audit, exports, helpers. **This is where backend calls will replace localStorage.** |
| `src/hooks` | Cross-cutting React hooks. |
| `src/assets` | Static imported images (logo, mark). Always import — never hardcode `/public` paths. |

### 7.2 Important files

| File | Why it matters |
| --- | --- |
| `src/styles.css` | Single source of truth for colours, radii, shadows, reusable classes. |
| `src/lib/mock-data.ts` | All seed employees/admins/tasks. **Delete once APIs land.** |
| `src/lib/accounts.ts` | Mock account store + credential verification + `OPEN_ACCESS` bypass. |
| `src/lib/auth.tsx` | `AuthProvider` / `useAuth()` — session context, localStorage-backed. |
| `src/lib/ids.ts` | `DMSEMPyyNN`, `DMSADMNN`, `DMSDIRNN`, `DMSPRJxxx` generators. |
| `src/lib/audit-log.ts` | `logAudit()` — call on every mutation. |
| `src/lib/brand.ts` | Centralised logo/brand asset exports (fixes missing-logo-on-export). |
| `src/router.tsx` | Router creation + React Query client. |

## 8. Component Structure

```text
__root.tsx
└── ThemeProvider → AuthProvider → QueryClientProvider
    ├── (public)  auth-shell.tsx
    │   ├── login.tsx → otp-verification.tsx
    │   ├── forgot-password.tsx → password-recovery.tsx
    │   └── reset-password.tsx
    └── (private) dashboard-shell.tsx
        ├── app-sidebar.tsx        (desktop rail / tablet collapse / mobile drawer)
        ├── route-breadcrumb.tsx
        ├── notifications-menu.tsx
        ├── profile-menu.tsx + theme-toggle.tsx
        └── <Outlet/>
            └── page-container.tsx → page-header.tsx → module content
                ├── stat-card.tsx / status-badge.tsx / id-badge.tsx
                ├── task-table.tsx  ⇄ record-card.tsx (mobile)
                ├── task-card.tsx → task-detail-dialog.tsx
                ├── proof-uploader.tsx → submission-detail-dialog.tsx
                └── empty-state.tsx / error-state.tsx / skeletons.tsx
```

## 9. Installation Guide

**Requirements:** Node.js ≥ 20 (install via [nvm](https://github.com/nvm-sh/nvm)), npm or bun.

```sh
git clone <repository-url>
cd <repository-name>
npm install
```

## 10. Running Locally

```sh
npm run dev          # Vite dev server (default http://localhost:8080)
```

Sign in with **any email and password** — `OPEN_ACCESS` in
`src/lib/accounts.ts` is `true`. The OTP step accepts **`123456`**
(`DEMO_OTP` in `src/lib/otp.ts`).

## 11. Build Instructions

```sh
npm run build        # production build
npm run build:dev    # development-mode build (prerender check)
npm run preview      # serve the production build locally
npm run lint         # eslint
npm run format       # prettier
```

## 12. Deployment Instructions

See **[DEPLOYMENT.md](./DEPLOYMENT.md)**. In short: `npm run build`, then deploy
the generated output through Lovable Publish (default) or any host that supports
the TanStack Start edge/Worker output.

## 13. Environment Variables

No variables are required today (fully client-side mock data).
Once the backend lands:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | client | REST API base URL |
| `VITE_ENABLE_OPEN_ACCESS` | client | Force-disable the dev auth bypass in prod |
| `DATABASE_URL` | server | Database connection string |
| `JWT_SECRET` | server | Access-token signing key |
| `JWT_REFRESH_SECRET` | server | Refresh-token signing key |
| `SMTP_*` / `RESEND_API_KEY` | server | OTP + notification email delivery |
| `STORAGE_BUCKET` / `S3_*` | server | Proof + avatar storage |

> ⚠️ Client-visible values **must** be prefixed `VITE_`. Server secrets must be
> read **inside** a handler (`process.env['X']`), never at module scope.

## 14. Dependencies

Runtime highlights: `react@19`, `@tanstack/react-router`, `@tanstack/react-start`,
`@tanstack/react-query`, `tailwindcss@4`, `recharts`, `react-hook-form`, `zod`,
`date-fns`, `lucide-react`, `sonner`, `input-otp`, `cmdk`, and the Radix UI set
backing shadcn/ui. See `package.json` for exact versions.

## 15. Coding Standards

- **TypeScript strict.** No `any` in new code; export shared types from `src/lib`.
- **Design tokens only.** Never hardcode colours (`text-white`, `bg-[#111]`).
  Use semantic tokens defined in `src/styles.css`.
- **Tailwind for layout/spacing/responsive**; reusable visuals belong in CSS
  classes (`.dashboard-card`, `.btn-primary`, …).
- **Route files stay thin.** Extract > ~150 lines into `src/components/<module>/`.
- **Logic ≠ styling.** Data shaping lives in `src/lib` or a hook.
- **Every mutation calls `logAudit()`.**
- **Mobile-first.** 44px minimum touch targets; tables collapse to `record-card`.
- File naming: `kebab-case.tsx` for components, `kebab-case.ts` for libs.

## 16. Best Practices

- Prefer route loaders + `useSuspenseQuery` over `useEffect` fetching once APIs exist.
- Keep IDs generated server-side after integration; `src/lib/ids.ts` becomes a formatter only.
- Validate with zod on both client and server — never trust client input.
- Read browser storage inside `useEffect`/hydration guards to avoid SSR mismatch.
- Never statically import browser-only libs into SSR routes.

## 17. Future Improvements

- Replace all `*-store.ts` localStorage stores with React Query + REST/RPC.
- Server-side pagination + full-text search for employees, tasks, audit logs.
- Real-time updates for review queue and notifications.
- Role/permission matrix beyond binary admin/employee.
- Unit tests (Vitest) + E2E (Playwright) coverage.
- Accessibility audit (focus traps, ARIA labels on icon-only buttons).
- i18n scaffolding.

## 18. Developer Notes

- `OPEN_ACCESS = true` in `src/lib/accounts.ts` allows **any** credentials.
  **Set it to `false` before any production deployment.**
- `DEMO_OTP = "123456"` in `src/lib/otp.ts` must become `null` in production.
- `src/routeTree.gen.ts` is generated — never hand-edit.
- Mock data source of truth: `src/lib/mock-data.ts`.
- All localStorage keys are prefixed `dimisi-` or `poll-`.

---

### Documentation index

| Document | Contents |
| --- | --- |
| [API_INTEGRATION.md](./API_INTEGRATION.md) | Endpoint roadmap + file-wise integration table |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Proposed tables, fields, relationships, JSON samples |
| [ROUTES.md](./ROUTES.md) | Every route, purpose, protection, role access |
| [COMPONENTS.md](./COMPONENTS.md) | Reusable components, props, usage |
| [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) | Current + target state architecture |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Build, env, hosting, troubleshooting |
| [SECURITY.md](./SECURITY.md) | Auth, OTP, RBAC, sessions, audit |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
