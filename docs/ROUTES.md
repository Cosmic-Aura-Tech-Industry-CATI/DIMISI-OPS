# Frontend Routes

File-based routing via TanStack Router. Every `.tsx` in `src/routes/` maps to a
URL; dots become path separators (`admin.employees.$id.tsx` → `/admin/employees/:id`).

> ⚠️ `src/routeTree.gen.ts` is generated. Never edit it by hand.

---

## 1. Public routes

| Route | File | Purpose | Access | Role |
| --- | --- | --- | --- | --- |
| `/` | `index.tsx` | Landing / redirect to the correct panel or login | Public | Any |
| `/login` | `login.tsx` | Role selection, credentials, OTP second factor | Public | Any |
| `/forgot-password` | `forgot-password.tsx` | 4-step recovery wizard entry | Public | Any |
| `/reset-password` | `reset-password.tsx` | Set new password from recovery token | Public | Any |
| `*` (404) | `__root.tsx` | Not-found screen | Public | Any |

## 2. Admin panel — layout `admin.tsx` (`/admin`)

| Route | File | Purpose | Access | Role |
| --- | --- | --- | --- | --- |
| `/admin` | `admin.index.tsx` | Dashboard: 6 KPI cards, charts, quick actions | Protected | Admin |
| `/admin/employees` | `admin.employees.index.tsx` | Employee list (table ⇄ cards on mobile) | Protected | Admin |
| `/admin/employees/new` | `admin.employees.new.tsx` | Create employee, auto ID + credentials | Protected | Admin |
| `/admin/employees/:id` | `admin.employees.$id.tsx` | Employee profile with tabs (overview, tasks, points, activity) | Protected | Admin |
| `/admin/employees/:id/edit` | `admin.employees.$id.edit.tsx` | Edit employee | Protected | Admin |
| `/admin/admins` | `admin.admins.index.tsx` | Admin list | Protected | Admin / Director |
| `/admin/admins/new` | `admin.admins.new.tsx` | Provision admin | Protected | Director |
| `/admin/admins/:id` | `admin.admins.$id.tsx` | Admin detail | Protected | Admin / Director |
| `/admin/admins/:id/edit` | `admin.admins.$id.edit.tsx` | Edit admin (permanent directors protected) | Protected | Director |
| `/admin/departments` | `admin.departments.tsx` | Departments + designations management | Protected | Admin |
| `/admin/projects` | `admin.projects.tsx` | Project CRUD, archive, deletion guards | Protected | Admin |
| `/admin/tasks` | `admin.tasks.index.tsx` | Task list, filters by category/status | Protected | Admin |
| `/admin/tasks/new` | `admin.tasks.new.tsx` | Create universal / project / direct task | Protected | Admin |
| `/admin/tasks/:id` | `admin.tasks.$id.tsx` | Task detail | Protected | Admin |
| `/admin/tasks/:id/edit` | `admin.tasks.$id.edit.tsx` | Edit task | Protected | Admin |
| `/admin/task-reviews` | `admin.task-reviews.tsx` | Review centre: approve / reject / remarks, proof download | Protected | Admin |
| `/admin/notices` | `admin.notices.tsx` | Notice board CRUD + pinning | Protected | Admin |
| `/admin/leaderboard` | `admin.leaderboard.tsx` | Org-wide points ranking | Protected | Admin |
| `/admin/reports` | `admin.reports.tsx` | Employee / task / project / department analytics | Protected | Admin |
| `/admin/audit-logs` | `admin.audit-logs.tsx` | Audit trail + CSV/Excel/PDF export | Protected | Admin / Director |
| `/admin/activity` | `admin.activity.tsx` | Recent activity feed | Protected | Admin |
| `/admin/notifications` | `admin.notifications.tsx` | Full notification list | Protected | Admin |
| `/admin/settings` | `admin.settings.tsx` | Preferences + OTP password change | Protected | Admin |

## 3. Employee panel — layout `employee.tsx` (`/employee`)

| Route | File | Purpose | Access | Role |
| --- | --- | --- | --- | --- |
| `/employee` | `employee.index.tsx` | Dashboard: welcome hero, KPIs, performance trend, available tasks | Protected | Employee |
| `/employee/tasks` | `employee.tasks.index.tsx` | My tasks + available pool (first-come-first-served) | Protected | Employee |
| `/employee/tasks/:id` | `employee.tasks.$id.index.tsx` | Task detail (read-only brief) | Protected | Employee |
| `/employee/tasks/:id/submit` | `employee.tasks.$id.submit.tsx` | Proof submission page (20 MB multi-file + checklist) | Protected | Employee (assignee) |
| `/employee/tasks/:id/submission` | `employee.tasks.$id.submission.tsx` | View own submission + review outcome | Protected | Employee (assignee) |
| `/employee/pending` | `employee.pending.tsx` | Tasks in progress | Protected | Employee |
| `/employee/pending-review` | `employee.pending-review.tsx` | Submitted, awaiting admin review | Protected | Employee |
| `/employee/completed` | `employee.completed.tsx` | Approved tasks + submission details | Protected | Employee |
| `/employee/rejected` | `employee.rejected.tsx` | Rejected submissions with remarks | Protected | Employee |
| `/employee/history` | `employee.history.tsx` | Full task history | Protected | Employee |
| `/employee/points` | `employee.points.tsx` | Points ledger | Protected | Employee |
| `/employee/leaderboard` | `employee.leaderboard.tsx` | Ranking with own position highlighted | Protected | Employee |
| `/employee/performance` | `employee.performance.tsx` | Personal performance charts | Protected | Employee |
| `/employee/statistics` | `employee.statistics.tsx` | Detailed personal stats | Protected | Employee |
| `/employee/notices` | `employee.notices.tsx` | Read-only notice board | Protected | Employee |
| `/employee/notifications` | `employee.notifications.tsx` | Notification feed | Protected | Employee |
| `/employee/profile` | `employee.profile.tsx` | Profile (bio + avatar editable only) | Protected | Employee |
| `/employee/settings` | `employee.settings.tsx` | Preferences + OTP password change | Protected | Employee |

## 4. Protection model

**Today (frontend-only):** `admin.tsx` and `employee.tsx` layout routes read
`useAuth()` and redirect to `/login` when there is no session, and cross-redirect
when the session role does not match the panel.

**Target:** move the gate into a route-level guard backed by a server session
check. Recommended structure once auth is real:

```text
src/routes/
├── _authenticated/          # pathless layout with server-side session gate
│   ├── route.tsx            # redirect → /login when unauthenticated
│   ├── admin/…              # additionally assert role === 'admin'
│   └── employee/…           # additionally assert role === 'employee'
```

> ⚠️ Never call an auth-protected server function from a **public** route loader
> — SSR/prerender has no session and it will 401 the build.

## 5. Navigation entry points

| Surface | File |
| --- | --- |
| Sidebar (desktop rail / tablet collapse / mobile drawer) | `src/components/app-sidebar.tsx` |
| Breadcrumbs | `src/components/route-breadcrumb.tsx` |
| Header bell → notification routes | `src/components/notifications-menu.tsx` |
| Avatar menu → profile / settings / logout | `src/components/profile-menu.tsx` |
