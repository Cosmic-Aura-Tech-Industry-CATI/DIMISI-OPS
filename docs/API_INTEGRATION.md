# API Integration Guide

How to replace the current localStorage mock layer with a real backend, in a
safe, dependency-ordered sequence.

---

## 1. Integration principles

1. **Never call `fetch` from a route file.** Add a service module in
   `src/lib/services/<domain>.ts` (or a `createServerFn` wrapper) and consume it
   through React Query.
2. **One store at a time.** Each `src/lib/*-store.ts` maps to exactly one API
   domain — swap its internals, keep its exported function signatures, and every
   consuming component keeps working unchanged.
3. **Keep audit logging.** `logAudit()` calls become server-side writes; the
   client keeps calling the same helper until the server owns it.
4. **Validate with zod** at the service boundary in both directions.
5. **IDs move server-side.** `src/lib/ids.ts` stays only as a display formatter.

### Suggested service layout (to create)

```text
src/lib/
├── api/
│   ├── client.ts          # fetch wrapper: base URL, auth header, error mapping
│   └── types.ts           # shared DTOs generated from backend contract
└── services/
    ├── auth.service.ts
    ├── employees.service.ts
    ├── admins.service.ts
    ├── projects.service.ts
    ├── tasks.service.ts
    ├── submissions.service.ts
    ├── notices.service.ts
    ├── leaderboard.service.ts
    ├── reports.service.ts
    ├── audit.service.ts
    └── notifications.service.ts
```

---

## 2. API Integration Roadmap

### STEP 1 — Authentication

| Endpoint | Method | Notes |
| --- | --- | --- |
| `/auth/login` | POST | `{ email, password, role }` → pending-OTP token |
| `/auth/otp/send` | POST | Issue + email a 6-digit code |
| `/auth/otp/verify` | POST | Exchange code for access + refresh token |
| `/auth/logout` | POST | Invalidate refresh token / session |
| `/auth/refresh` | POST | Rotate access token |
| `/auth/forgot-password` | POST | Start recovery, send recovery OTP |
| `/auth/forgot-password/verify` | POST | Verify recovery OTP |
| `/auth/reset-password` | POST | Set new password with recovery token |
| `/auth/change-password` | POST | Authenticated; requires OTP confirmation |
| `/auth/me` | GET | Hydrate current session user |

### STEP 2 — Employee APIs

| Endpoint | Method |
| --- | --- |
| `/employees` | GET (paginated, searchable) |
| `/employees/:id` | GET |
| `/employees` | POST |
| `/employees/:id` | PATCH |
| `/employees/:id` | DELETE |
| `/employees/:id/statistics` | GET |
| `/employees/:id/profile` | PATCH (bio + avatar only) |

### STEP 3 — Admin APIs

| Endpoint | Method |
| --- | --- |
| `/admins` | GET |
| `/admins/:id` | GET |
| `/admins` | POST |
| `/admins/:id` | PATCH |
| `/admins/:id` | DELETE (reject permanent directors) |
| `/departments` | GET / POST |
| `/departments/:id` | PATCH / DELETE |
| `/departments/:id/designations` | GET / POST / DELETE |

### STEP 4 — Projects

| Endpoint | Method |
| --- | --- |
| `/projects` | GET / POST |
| `/projects/:id` | GET / PATCH |
| `/projects/:id/archive` | POST |
| `/projects/:id` | DELETE (blocked if tasks exist) |
| `/projects/:id/members` | GET / POST / DELETE |
| `/projects/:id/statistics` | GET |

### STEP 5 — Tasks

| Endpoint | Method | Notes |
| --- | --- | --- |
| `/tasks` | GET | Filter by `category=universal\|project\|direct` |
| `/tasks` | POST | Create (any category) |
| `/tasks/:id` | GET / PATCH / DELETE | |
| `/tasks/available` | GET | Unclaimed universal/project tasks |
| `/tasks/:id/pickup` | POST | **Atomic**, first-come-first-served |
| `/tasks/:id/submit` | POST | Multipart proof upload |
| `/tasks/:id/submissions` | GET | |
| `/submissions/:id/approve` | POST | Awards points |
| `/submissions/:id/reject` | POST | `{ remarks }` |

> ⚠️ **Pickup must be transactional** (`UPDATE … WHERE assignee_id IS NULL`)
> to prevent two employees claiming the same task.

### STEP 6 — Notice Board

`/notices` GET/POST · `/notices/:id` PATCH/DELETE · `/notices/:id/pin` POST

### STEP 7 — Leaderboard

`/leaderboard` GET (`?period=week|month|all&department=`) ·
`/leaderboard/me` GET · `/points/history` GET

### STEP 8 — Audit Logs

`/audit-logs` GET (filters: category, actor, date range, status) ·
`/audit-logs/export` GET (`?format=csv|xlsx|pdf`)

### STEP 9 — Reports

`/reports/employees` · `/reports/tasks` · `/reports/projects` ·
`/reports/departments` · `/reports/export` — all GET.

### STEP 10 — Notifications & Settings

`/notifications` GET · `/notifications/read` POST ·
`/settings/preferences` GET/PATCH

---

## 3. Recommended integration sequence (and why)

```text
Authentication
   ↓
Employees
   ↓
Admins
   ↓
Projects
   ↓
Tasks
   ↓
Task Reviews
   ↓
Notice Board
   ↓
Leaderboard
   ↓
Reports
   ↓
Audit Logs
   ↓
Notifications
   ↓
Settings
```

| Stage | Why it comes here |
| --- | --- |
| **Authentication** | Every other endpoint needs an identity and a bearer token. Nothing can be authorised or audited before this exists. |
| **Employees** | The primary actor entity. Tasks, points, submissions and leaderboard all reference an employee ID. |
| **Admins** | Admins (and departments/designations) are required to create employees and to authorise reviews. |
| **Projects** | Tasks may be project-scoped, so projects must exist before project tasks can be created. |
| **Tasks** | Depends on employees (assignee), admins (creator) and projects (scope). |
| **Task Reviews** | Reviews consume task submissions — meaningless without tasks. |
| **Notice Board** | Independent, low-risk; good confidence-builder once auth + RBAC work. |
| **Leaderboard** | Derived from approved submissions and points, so reviews must be live first. |
| **Reports** | Aggregates across employees, tasks, projects and departments — requires all of them. |
| **Audit Logs** | Reads best once every mutation endpoint exists, so the log is complete rather than partial. |
| **Notifications** | Triggered by events from all previous modules. |
| **Settings** | Preferences are the least blocking; safe to finish last. |

---

## 4. File-wise API integration table

Legend — **Status:** `Pending` (mock only) · `Partial` · `Done`.

### 4.1 Authentication & session

| File Path | Purpose | Required API Endpoint | Method | Priority | Backend Dependency | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `src/routes/login.tsx` | Login page + role select | `/auth/login` | POST | High | Authentication | Pending |
| `src/components/otp-verification.tsx` | OTP second factor UI | `/auth/otp/send`, `/auth/otp/verify` | POST | High | Auth + Email | Pending |
| `src/lib/otp.ts` | Mock OTP issue/verify | `/auth/otp/*` | POST | High | Auth + Email | Pending |
| `src/lib/accounts.ts` | Credential store + verify | `/auth/login`, `/auth/me` | POST/GET | High | Authentication | Pending |
| `src/lib/auth.tsx` | Session context | `/auth/me`, `/auth/refresh`, `/auth/logout` | GET/POST | High | Authentication | Pending |
| `src/routes/forgot-password.tsx` | Recovery entry | `/auth/forgot-password` | POST | High | Auth + Email | Pending |
| `src/components/password-recovery.tsx` | 4-step recovery wizard | `/auth/forgot-password/verify`, `/auth/reset-password` | POST | High | Auth + Email | Pending |
| `src/lib/recovery-otp.ts` | Recovery OTP channel | `/auth/forgot-password/*` | POST | High | Auth + Email | Pending |
| `src/routes/reset-password.tsx` | Set new password | `/auth/reset-password` | POST | High | Authentication | Pending |
| `src/components/change-password-card.tsx` | Settings password change | `/auth/change-password` | POST | High | Authentication | Pending |
| `src/lib/password-otp.ts` | Change-password OTP channel | `/auth/otp/*` | POST | High | Auth + Email | Pending |
| `src/lib/password.ts` | Strength/validation helpers | — (client only) | — | Low | None | Done |

### 4.2 Employees

| File Path | Purpose | Required API Endpoint | Method | Priority | Backend Dependency | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `src/routes/admin.employees.index.tsx` | Employee list | `/employees` | GET | High | Employees | Pending |
| `src/routes/admin.employees.$id.tsx` | Employee detail tabs | `/employees/:id`, `/employees/:id/statistics` | GET | High | Employees | Pending |
| `src/routes/admin.employees.new.tsx` | Create employee | `/employees` | POST | High | Employees | Pending |
| `src/routes/admin.employees.$id.edit.tsx` | Update employee | `/employees/:id` | PATCH | High | Employees | Pending |
| `src/components/account-form-parts.tsx` | Dept/designation dropdowns | `/departments` | GET | High | Departments | Pending |
| `src/components/account-created-dialog.tsx` | Credential handoff | `/employees` response | POST | Medium | Employees | Pending |
| `src/routes/employee.profile.tsx` | Employee profile view | `/employees/:id` | GET | Medium | Employees | Pending |
| `src/components/edit-profile-dialog.tsx` | Bio + avatar edit | `/employees/:id/profile` | PATCH | Medium | Employees + Storage | Pending |
| `src/lib/profile-store.ts` | Profile overrides | `/employees/:id/profile` | PATCH | Medium | Employees | Pending |

### 4.3 Admins & departments

| File Path | Purpose | Required API Endpoint | Method | Priority | Backend Dependency | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `src/routes/admin.admins.index.tsx` | Admin list | `/admins` | GET | High | Admins | Pending |
| `src/routes/admin.admins.$id.tsx` | Admin detail | `/admins/:id` | GET | High | Admins | Pending |
| `src/routes/admin.admins.new.tsx` | Create admin | `/admins` | POST | High | Admins | Pending |
| `src/routes/admin.admins.$id.edit.tsx` | Update admin | `/admins/:id` | PATCH | High | Admins | Pending |
| `src/routes/admin.departments.tsx` | Departments + designations | `/departments`, `/departments/:id/designations` | GET/POST/PATCH/DELETE | High | Departments | Pending |
| `src/lib/department-store.ts` | Department store | `/departments` | ALL | High | Departments | Pending |
| `src/lib/ids.ts` | ID generation | server-issued IDs | — | Medium | All | Pending |

### 4.4 Projects

| File Path | Purpose | Required API Endpoint | Method | Priority | Backend Dependency | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `src/routes/admin.projects.tsx` | Project module | `/projects` | GET/POST/PATCH/DELETE | High | Projects | Pending |
| `src/components/project-dialogs.tsx` | Create/edit/delete dialogs | `/projects/:id` | POST/PATCH/DELETE | High | Projects | Pending |
| `src/lib/project-store.ts` | Project store | `/projects` | ALL | High | Projects | Pending |
| `src/lib/projects.ts` | Project helpers/derivations | `/projects/:id/statistics` | GET | Medium | Projects | Pending |

### 4.5 Tasks & submissions

| File Path | Purpose | Required API Endpoint | Method | Priority | Backend Dependency | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `src/routes/admin.tasks.index.tsx` | Task list | `/tasks` | GET | High | Tasks | Pending |
| `src/routes/admin.tasks.new.tsx` | Create task | `/tasks` | POST | High | Tasks + Projects | Pending |
| `src/routes/admin.tasks.$id.tsx` | Task detail | `/tasks/:id` | GET | High | Tasks | Pending |
| `src/routes/admin.tasks.$id.edit.tsx` | Edit task | `/tasks/:id` | PATCH | High | Tasks | Pending |
| `src/components/task-form.tsx` | Task create/edit form | `/tasks`, `/projects` | POST/GET | High | Tasks + Projects | Pending |
| `src/components/available-tasks.tsx` | Pickup pool | `/tasks/available`, `/tasks/:id/pickup` | GET/POST | High | Tasks | Pending |
| `src/lib/task-store.ts` | Task store | `/tasks` | ALL | High | Tasks | Pending |
| `src/routes/employee.tasks.index.tsx` | My tasks | `/tasks?assignee=me` | GET | High | Tasks | Pending |
| `src/routes/employee.tasks.$id.index.tsx` | Task detail | `/tasks/:id` | GET | High | Tasks | Pending |
| `src/routes/employee.tasks.$id.submit.tsx` | Submit proof | `/tasks/:id/submit` | POST (multipart) | High | Tasks + Storage | Pending |
| `src/components/proof-uploader.tsx` | 20 MB multi-file upload | `/uploads` or presigned URL | POST | High | Storage | Pending |
| `src/lib/submission-store.ts` | Submission store | `/tasks/:id/submissions` | ALL | High | Submissions | Pending |
| `src/routes/employee.tasks.$id.submission.tsx` | Submission view | `/submissions/:id` | GET | Medium | Submissions | Pending |
| `src/components/submission-detail-dialog.tsx` | Submission detail | `/submissions/:id` | GET | Medium | Submissions | Pending |
| `src/routes/employee.pending.tsx` | Pending tasks | `/tasks?status=pending` | GET | Medium | Tasks | Pending |
| `src/routes/employee.pending-review.tsx` | Awaiting review | `/submissions?status=pending` | GET | Medium | Submissions | Pending |
| `src/routes/employee.completed.tsx` | Completed tasks | `/tasks?status=completed` | GET | Medium | Tasks | Pending |
| `src/routes/employee.rejected.tsx` | Rejected submissions | `/submissions?status=rejected` | GET | Medium | Submissions | Pending |
| `src/routes/employee.history.tsx` | Task history | `/tasks?assignee=me&history=1` | GET | Low | Tasks | Pending |

### 4.6 Reviews

| File Path | Purpose | Required API Endpoint | Method | Priority | Backend Dependency | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `src/routes/admin.task-reviews.tsx` | Review centre queue | `/submissions?status=pending` | GET | High | Submissions | Pending |
| `src/lib/review-store.ts` | Approve/reject/remarks | `/submissions/:id/approve`, `/submissions/:id/reject` | POST | High | Submissions + Points | Pending |

### 4.7 Notices, leaderboard, reports, audit, notifications

| File Path | Purpose | Required API Endpoint | Method | Priority | Backend Dependency | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `src/routes/admin.notices.tsx` | Notice CRUD + pin | `/notices` | GET/POST/PATCH/DELETE | Medium | Notices | Pending |
| `src/components/notices/notice-composer.tsx` | Compose notice | `/notices` | POST | Medium | Notices | Pending |
| `src/lib/notice-store.ts` | Notice store | `/notices` | ALL | Medium | Notices | Pending |
| `src/routes/employee.notices.tsx` | Read-only notices | `/notices` | GET | Medium | Notices | Pending |
| `src/routes/admin.leaderboard.tsx` | Admin leaderboard | `/leaderboard` | GET | Medium | Leaderboard | Pending |
| `src/routes/employee.leaderboard.tsx` | Employee leaderboard | `/leaderboard`, `/leaderboard/me` | GET | Medium | Leaderboard | Pending |
| `src/routes/employee.points.tsx` | Points history | `/points/history` | GET | Medium | Points | Pending |
| `src/routes/admin.reports.tsx` | Reports shell | `/reports/*` | GET | Medium | Reports | Pending |
| `src/components/reports/use-report-data.ts` | Report aggregation hook | `/reports/*` | GET | Medium | Reports | Pending |
| `src/routes/admin.audit-logs.tsx` | Audit log viewer | `/audit-logs` | GET | Medium | Audit | Pending |
| `src/lib/audit-log.ts` | Audit writer | `/audit-logs` | POST | High | Audit | Pending |
| `src/lib/audit-export.ts` | CSV/XLSX/PDF export | `/audit-logs/export` | GET | Low | Audit | Pending |
| `src/routes/admin.activity.tsx` | Activity feed | `/audit-logs?recent=1` | GET | Low | Audit | Pending |
| `src/components/notifications-menu.tsx` | Header bell | `/notifications` | GET | Medium | Notifications | Pending |
| `src/routes/admin.notifications.tsx` | Admin feed | `/notifications`, `/notifications/read` | GET/POST | Medium | Notifications | Pending |
| `src/routes/employee.notifications.tsx` | Employee feed | `/notifications` | GET | Medium | Notifications | Pending |
| `src/lib/admin-notification-store.ts` | Notification store | `/notifications` | ALL | Medium | Notifications | Pending |
| `src/routes/admin.settings.tsx` | Admin settings | `/settings/preferences` | GET/PATCH | Low | Settings | Pending |
| `src/routes/employee.settings.tsx` | Employee settings | `/settings/preferences` | GET/PATCH | Low | Settings | Pending |
| `src/routes/admin.index.tsx` | Admin dashboard | `/reports/overview` | GET | High | Reports | Pending |
| `src/routes/employee.index.tsx` | Employee dashboard | `/employees/:id/statistics` | GET | High | Employees | Pending |

---

## 5. Recommended request/response conventions

```ts
// Success
{ "data": <payload>, "meta": { "page": 1, "perPage": 20, "total": 143 } }

// Error
{ "error": { "code": "VALIDATION_FAILED", "message": "…", "fields": { "email": "Already in use" } } }
```

- Auth: `Authorization: Bearer <accessToken>`; refresh token in an httpOnly cookie.
- Dates: ISO-8601 UTC strings.
- Pagination: `?page=&perPage=&sort=&order=&q=`.
- Idempotency key header on task pickup and submission approval.
