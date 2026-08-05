# Component Reference

All components live under `src/components/`. Primitives in `src/components/ui/`
are shadcn/ui (Radix-based) and are documented upstream — this file covers the
**application** components.

Legend: **Reusable** = safe to use anywhere · **Module** = tied to one feature.

---

## 1. Layout & shell

### `dashboard-shell.tsx` — Reusable
- **Purpose:** Authenticated app frame: sidebar, header (breadcrumb, notifications, theme toggle, profile menu) and `<Outlet />` content area.
- **Props:** `{ children?: ReactNode }` (composition-driven).
- **Used in:** `admin.tsx`, `employee.tsx`.
- **Dependencies:** `app-sidebar`, `route-breadcrumb`, `notifications-menu`, `profile-menu`, `theme-toggle`, `use-mobile`.
- **Future:** Move header actions into a slot API; add a global command palette (`cmdk`).

### `app-sidebar.tsx` — Reusable
- **Purpose:** Role-aware navigation. Desktop rail, tablet collapse, mobile off-canvas drawer that auto-closes on navigation.
- **Props:** role derived from `useAuth()`; no external props.
- **Used in:** `dashboard-shell`.
- **Future:** Data-drive the nav config from a single array + permission flags.

### `auth-shell.tsx` — Reusable
- **Purpose:** Split layout for public auth pages (brand panel + form panel, feature cards).
- **Props:** `{ title, subtitle, children }`.
- **Used in:** `login`, `forgot-password`, `reset-password`.

### `page-container.tsx` / `page-header.tsx` — Reusable
- **Purpose:** Consistent max-width, padding and page title/description/actions.
- **Props:** `page-header`: `{ title, description?, actions?, icon? }`.
- **Used in:** Nearly every route.

### `route-breadcrumb.tsx` — Reusable
- **Purpose:** Derives breadcrumbs from the active route match.
- **Future:** Allow routes to publish a custom crumb label via route `context`.

---

## 2. Data display

### `stat-card.tsx` — Reusable
- **Purpose:** KPI tile with label, value, delta and icon.
- **Props:** `{ label, value, icon?, trend?, hint? }`.
- **Used in:** Admin/employee dashboards, statistics, reports.

### `task-table.tsx` — Reusable
- **Purpose:** Desktop data table for tasks with sorting and row actions.
- **Props:** `{ tasks, onSelect?, showAssignee? }`.
- **Used in:** Admin tasks, employee task lists.
- **Future:** Server-side pagination + column visibility toggles.

### `record-card.tsx` — Reusable
- **Purpose:** Mobile counterpart of any table row (label/value pairs + actions).
- **Props:** `{ title, subtitle?, fields, actions? }`.
- **Used in:** All list routes below the `md` breakpoint.

### `task-card.tsx` — Module (tasks)
- **Purpose:** Task summary card with "View Task" and "Submit for Review" actions.
- **Props:** `{ task, onPickup?, onSubmit? }`.
- **Dependencies:** `task-detail-dialog`, `status-badge`.

### `status-badge.tsx` / `id-badge.tsx` / `notice-badges.tsx` — Reusable
- **Purpose:** Consistent pills for status, entity codes (`DMSEMP…`) and notice categories.
- **Props:** `status-badge`: `{ status, size? }`; `id-badge`: `{ code, copyable? }`.

### `empty-state.tsx` / `error-state.tsx` / `loading.tsx` / `loading-screen.tsx` / `skeletons.tsx` — Reusable
- **Purpose:** Standardised empty, error, inline-loading, full-page loading and skeleton states.
- **Props:** `empty-state`: `{ icon?, title, description?, action? }`.

---

## 3. Forms & dialogs

### `task-form.tsx` — Module (tasks)
- **Purpose:** Create/edit task; category switch (universal / project / direct), project selector, assignee, points, due date, attachments, checklist.
- **Props:** `{ mode: 'create' | 'edit', task?, onSubmit }`.
- **Dependencies:** `project-store`, `department-store`, `accounts`, react-hook-form + zod.
- **Future:** Split category-specific fieldsets into subcomponents.

### `account-form-parts.tsx` — Module (accounts)
- **Purpose:** Shared field groups for employee/admin creation, including the correlated department → designation dropdowns.
- **Props:** `{ form, showRoleFields? }`.
- **Used in:** `admin.employees.new/edit`, `admin.admins.new/edit`.

### `account-created-dialog.tsx` — Module (accounts)
- **Purpose:** Post-creation summary showing generated ID and initial credentials.
- **Props:** `{ open, onOpenChange, account }`.

### `project-dialogs.tsx` — Module (projects)
- **Purpose:** Create / edit / archive / delete project dialogs with guards.
- **Props:** `{ mode, project?, open, onOpenChange }`.

### `task-detail-dialog.tsx` — Module (tasks)
- **Purpose:** Full read-only task brief opened from any task card/table row.
- **Props:** `{ taskId | task, open, onOpenChange }`.

### `submission-detail-dialog.tsx` — Module (submissions)
- **Purpose:** Shows submitted description, checklist state, files and review outcome.
- **Props:** `{ submission, open, onOpenChange }`.

### `proof-uploader.tsx` — Module (submissions)
- **Purpose:** Multi-file drag-and-drop uploader, 20 MB limit, multi-format, previews and removal.
- **Props:** `{ files, onChange, maxSizeMb?, accept? }`.
- **Future:** Switch to presigned-URL direct upload with per-file progress.

### `edit-profile-dialog.tsx` — Module (profile)
- **Purpose:** Employee self-service edit — **bio and avatar only**; admin-owned fields render read-only.
- **Props:** `{ open, onOpenChange, profile }`.

---

## 4. Authentication components

### `otp-verification.tsx` — Reusable
- **Purpose:** 6-digit OTP entry with resend cooldown, attempt counter and lockout messaging.
- **Props:** `{ email, onVerify, onResend, onBack }`.
- **Dependencies:** `input-otp`, `src/lib/otp.ts`.
- **Future:** Accept a `channel` prop so login / change-password / recovery share one instance cleanly.

### `password-recovery.tsx` — Module (auth)
- **Purpose:** 4-step wizard — Email → OTP → New password → Success.
- **Props:** `{ initialEmail?, onDone? }`.
- **Used in:** `forgot-password.tsx`, settings security card.

### `change-password-card.tsx` — Module (settings)
- **Purpose:** OTP-protected password change; forces sign-out on success and writes an audit entry.
- **Props:** none (reads `useAuth()`).
- **Used in:** `admin.settings.tsx`, `employee.settings.tsx`.

---

## 5. Header widgets

### `notifications-menu.tsx` — Reusable
- **Purpose:** Role-aware bell dropdown with unread count and "View all" link; fully responsive.
- **Props:** none (role from `useAuth()`).

### `profile-menu.tsx` — Reusable
- **Purpose:** Avatar dropdown → profile, settings, logout.

### `theme-toggle.tsx` — Reusable
- **Purpose:** Light/dark switch backed by `src/lib/theme.tsx`.

---

## 6. Module folders

### `src/components/admin-dashboard/`
| File | Purpose |
| --- | --- |
| `dashboard-data.ts` | Derives KPI + chart datasets from stores |
| `dashboard-widgets.tsx` | KPI cards and summary panels |
| `overview-charts.tsx` | Recharts area/bar/pie visualisations |
| `quick-actions.tsx` | Shortcut buttons to common admin flows |

### `src/components/notices/`
| File | Purpose |
| --- | --- |
| `notice-composer.tsx` | Create/edit notice form |
| `admin-notice-card.tsx` | Notice row with pin/edit/delete |
| `notice-filters.tsx` | Category/status filter bar |
| `notice-dialogs.tsx` | Confirm/delete dialogs |
| `use-notice-filters.ts` | Filter state hook |

### `src/components/reports/`
| File | Purpose |
| --- | --- |
| `use-report-data.ts` | Aggregation hook — **primary API swap point for reports** |
| `employee-report-tab.tsx` | Per-employee analytics |
| `task-report-tab.tsx` | Task throughput and status mix |
| `project-report-tab.tsx` | Project progress and delivery |
| `department-report-tab.tsx` | Department comparison |
| `overview-charts.tsx` | Shared chart set |
| `report-panels.tsx` | Panel/section wrappers |
| `reports-toolbar.tsx` | Date range, filters, export |
| `chart-theme.ts` | Recharts token mapping |

---

## 7. Hooks

| Hook | Purpose |
| --- | --- |
| `src/hooks/use-mobile.tsx` | Breakpoint detection for table ⇄ card switching and drawer behaviour |
| `src/lib/auth.tsx → useAuth()` | Current user, loading, `signInWith`, `logout` |
| `src/lib/accounts.ts → useAccounts()/useAllEmployees()/useAllAdmins()` | Account store subscriptions |
| `src/components/notices/use-notice-filters.ts` | Notice filtering |
| `src/components/reports/use-report-data.ts` | Report aggregation |

---

## 8. Component conventions

- ✅ Presentational components take data via props — they never read stores directly.
- ✅ Container/route components own data fetching and pass data down.
- ✅ Icon-only buttons must have `aria-label`.
- ✅ Minimum 44×44px touch targets on interactive elements.
- ❌ No hardcoded colour utilities — use the semantic tokens in `src/styles.css`.
- ❌ No business logic inside `src/components/ui/`.

## 9. Future improvements (cross-cutting)

- Extract a generic `<DataTable>` that renders `record-card` automatically on mobile.
- Add Storybook or a `/dev/components` route for visual review.
- Add prop-level JSDoc to every exported component.
- Introduce error boundaries per module using `error-state.tsx`.
