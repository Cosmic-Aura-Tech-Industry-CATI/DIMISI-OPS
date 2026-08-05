# Proposed Database Schema

Backend-agnostic design (works for PostgreSQL or a document store). SQL types
are given for Postgres; the JSON examples show the API representation.

---

## Entity relationship overview

```text
users ──1:1── employees ──*:1── departments ──1:*── designations
  │                │
  │                ├──1:*── task_submissions ──*:1── tasks ──*:1── projects
  │                ├──1:*── points_ledger
  │                └──1:1── leaderboard (materialised)
  │
  ├──1:*── sessions
  ├──1:*── otp_codes
  ├──1:*── password_resets
  ├──1:*── notifications
  ├──1:*── audit_logs
  └──1:*── notices (author)
```

---

## 1. `users`

**Purpose:** Single authentication identity for admins and employees.
**Primary key:** `id` (uuid)
**Relationships:** 1:1 `employees` / `admins`; 1:* `sessions`, `otp_codes`, `audit_logs`.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `email` | citext UNIQUE NOT NULL | login identifier |
| `password_hash` | text NOT NULL | argon2id / bcrypt |
| `role` | enum(`admin`,`employee`) | primary portal |
| `is_director` | boolean DEFAULT false | permanent, undeletable |
| `status` | enum(`active`,`inactive`,`suspended`) | |
| `email_verified_at` | timestamptz NULL | |
| `last_login_at` | timestamptz NULL | |
| `failed_login_count` | int DEFAULT 0 | |
| `created_at` / `updated_at` | timestamptz | |

```json
{
  "id": "7c1f…",
  "email": "ava.chen@dimisi.io",
  "role": "employee",
  "isDirector": false,
  "status": "active",
  "emailVerifiedAt": "2026-01-14T10:22:00Z",
  "lastLoginAt": "2026-08-05T09:11:00Z"
}
```

## 2. `employees`

**Purpose:** Employee profile and work metadata.
**PK:** `id` · **FK:** `user_id → users.id`, `department_id`, `designation_id`.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `user_id` | uuid FK UNIQUE | |
| `code` | varchar(12) UNIQUE | `DMSEMPyyNN` |
| `name` | text NOT NULL | |
| `phone` | varchar(20) NULL | |
| `avatar_url` | text NULL | storage URL |
| `avatar_initials` | varchar(2) | fallback |
| `about` | text NULL | employee-editable bio |
| `department_id` | uuid FK | |
| `designation_id` | uuid FK | job title |
| `points` | int DEFAULT 0 | denormalised total |
| `tasks_completed` | int DEFAULT 0 | denormalised |
| `status` | enum(`active`,`inactive`) | |
| `joined_at` | date NOT NULL | drives code sequence |

```json
{
  "id": "9a3e…",
  "code": "DMSEMP2402",
  "name": "Ava Chen",
  "email": "ava.chen@dimisi.io",
  "department": "Engineering",
  "designation": "Frontend Developer",
  "points": 1840,
  "tasksCompleted": 37,
  "status": "active",
  "joinedAt": "2024-02-11"
}
```

## 3. `admins`

**Purpose:** Admin/director profile.
**PK:** `id` · **FK:** `user_id`.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `user_id` | uuid FK UNIQUE | |
| `code` | varchar(12) UNIQUE | `DMSADMNN` / `DMSDIRNN` |
| `name` | text | |
| `phone` | varchar(20) NULL | |
| `avatar_url` | text NULL | |
| `department_id` | uuid FK NULL | |
| `job_title` | text | |
| `is_permanent` | boolean DEFAULT false | blocks delete |
| `joined_at` | date | |

```json
{ "id": "1b2c…", "code": "DMSDIR01", "name": "Shikhar Dixit", "jobTitle": "Director", "isPermanent": true }
```

## 4. `departments` / `designations`

| `departments` | Type |
| --- | --- |
| `id` | uuid PK |
| `name` | text UNIQUE |
| `description` | text NULL |
| `head_admin_id` | uuid FK NULL |
| `created_at` | timestamptz |

| `designations` | Type |
| --- | --- |
| `id` | uuid PK |
| `department_id` | uuid FK (cascade delete) |
| `title` | text |
| UNIQUE | (`department_id`,`title`) |

```json
{ "id": "d1", "name": "Engineering", "designations": [{ "id": "g1", "title": "Frontend Developer" }] }
```

## 5. `projects`

**PK:** `id` · **FK:** `created_by → admins.id`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `code` | varchar(12) UNIQUE | `DMSPRJ001` |
| `name` | text NOT NULL | |
| `description` | text NULL | |
| `status` | enum(`active`,`on_hold`,`completed`,`archived`) | |
| `start_date` / `due_date` | date NULL | |
| `created_by` | uuid FK | |
| `created_at` / `updated_at` | timestamptz | |

`project_members` join table: (`project_id`, `employee_id`, `role`, `joined_at`).

```json
{ "id": "p1", "code": "DMSPRJ001", "name": "Client Portal v2", "status": "active", "dueDate": "2026-10-30" }
```

## 6. `tasks`

**PK:** `id` · **FK:** `project_id` NULL, `assignee_id` NULL, `created_by`.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `code` | varchar(16) UNIQUE | `DMSTSKxxxx` |
| `title` | text NOT NULL | |
| `description` | text | |
| `category` | enum(`universal`,`project`,`direct`) | |
| `project_id` | uuid FK NULL | required when `category='project'` |
| `assignee_id` | uuid FK NULL | NULL = unclaimed pool |
| `created_by` | uuid FK admins | |
| `priority` | enum(`low`,`medium`,`high`,`urgent`) | |
| `status` | enum(`open`,`in_progress`,`pending_review`,`completed`,`rejected`,`cancelled`) | |
| `points` | int DEFAULT 0 | awarded on approval |
| `due_at` | timestamptz NULL | |
| `picked_up_at` | timestamptz NULL | |
| `attachments` | jsonb | admin-provided briefs |
| `checklist` | jsonb | `[{ "label": "...", "required": true }]` |

> ⚠️ Pickup concurrency: `UPDATE tasks SET assignee_id=$1, status='in_progress', picked_up_at=now() WHERE id=$2 AND assignee_id IS NULL RETURNING *;` — zero rows means someone else claimed it.

```json
{
  "id": "t1", "code": "DMSTSK0142", "title": "Refactor billing table",
  "category": "project", "projectId": "p1", "assigneeId": "9a3e…",
  "priority": "high", "status": "in_progress", "points": 50,
  "dueAt": "2026-08-12T18:00:00Z"
}
```

## 7. `task_submissions`

**PK:** `id` · **FK:** `task_id`, `employee_id`, `reviewed_by → admins.id`.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `task_id` | uuid FK | |
| `employee_id` | uuid FK | |
| `description` | text | work summary |
| `checklist_state` | jsonb | completed items |
| `files` | jsonb | `[{ name, url, size, mime }]`, max 20 MB each |
| `status` | enum(`pending`,`approved`,`rejected`) | |
| `remarks` | text NULL | reviewer feedback |
| `points_awarded` | int DEFAULT 0 | |
| `submitted_at` / `reviewed_at` | timestamptz | |
| `reviewed_by` | uuid FK NULL | |

```json
{
  "id": "s1", "taskId": "t1", "employeeId": "9a3e…",
  "description": "Refactored and covered with tests.",
  "files": [{ "name": "proof.png", "url": "https://…", "size": 184320, "mime": "image/png" }],
  "status": "approved", "pointsAwarded": 50, "reviewedBy": "1b2c…"
}
```

## 8. `points_ledger`

Append-only audit of every point movement (source of truth for leaderboard).

| Field | Type |
| --- | --- |
| `id` | uuid PK |
| `employee_id` | uuid FK |
| `submission_id` | uuid FK NULL |
| `delta` | int (may be negative) |
| `reason` | text |
| `created_at` | timestamptz |

```json
{ "id": "pl1", "employeeId": "9a3e…", "submissionId": "s1", "delta": 50, "reason": "Task approved: DMSTSK0142" }
```

## 9. `leaderboard` (materialised view / cached table)

| Field | Type |
| --- | --- |
| `employee_id` | uuid PK |
| `period` | enum(`week`,`month`,`all_time`) |
| `points` | int |
| `tasks_completed` | int |
| `rank` | int |
| `computed_at` | timestamptz |

```json
{ "employeeId": "9a3e…", "period": "month", "points": 420, "tasksCompleted": 9, "rank": 3 }
```

## 10. `notices`

| Field | Type |
| --- | --- |
| `id` | uuid PK |
| `title` | text |
| `body` | text |
| `category` | enum(`general`,`policy`,`event`,`urgent`) |
| `is_pinned` | boolean DEFAULT false |
| `audience` | enum(`all`,`employees`,`admins`,`department`) |
| `department_id` | uuid FK NULL |
| `author_id` | uuid FK admins |
| `published_at` / `expires_at` | timestamptz |

```json
{ "id": "n1", "title": "Quarterly review week", "category": "policy", "isPinned": true, "audience": "all" }
```

## 11. `notifications`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `user_id` | uuid FK | recipient |
| `type` | enum(`new_employee`,`new_admin`,`submission`,`approval`,`rejection`,`notice`,`system`) | |
| `title` / `message` | text | |
| `link` | text NULL | deep link |
| `read_at` | timestamptz NULL | |
| `created_at` | timestamptz | |
| `expires_at` | timestamptz | **created_at + 30 days** |

```json
{ "id": "nf1", "type": "approval", "title": "Task approved", "message": "DMSTSK0142 approved (+50 pts)", "readAt": null }
```

## 12. `audit_logs`

| Field | Type |
| --- | --- |
| `id` | uuid PK |
| `category` | enum(`authentication`,`employee`,`admin`,`task`,`project`,`notice`,`settings`,`department`) |
| `action` | text (`Login`, `Added Employee`, …) |
| `actor_id` | uuid FK NULL |
| `actor_name` / `actor_code` | text |
| `target` / `target_id` | text NULL |
| `details` | text |
| `status` | enum(`success`,`failed`) |
| `ip_address` | inet NULL |
| `user_agent` | text NULL |
| `created_at` | timestamptz (index) |

```json
{ "id": "a1", "category": "task", "action": "Approved Submission", "actorCode": "DMSDIR01",
  "target": "DMSTSK0142", "status": "success", "createdAt": "2026-08-05T09:40:00Z" }
```

## 13. `reports` (optional snapshots)

| Field | Type |
| --- | --- |
| `id` | uuid PK |
| `type` | enum(`employee`,`task`,`project`,`department`,`overview`) |
| `period_start` / `period_end` | date |
| `payload` | jsonb (aggregated metrics) |
| `generated_by` | uuid FK NULL |
| `generated_at` | timestamptz |

## 14. `otp_codes`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `email` | citext (index) | |
| `code_hash` | text | **never store plaintext** |
| `purpose` | enum(`login`,`password_change`,`password_reset`) | channel isolation |
| `attempts` | int DEFAULT 0 | max 5 |
| `locked` | boolean DEFAULT false | |
| `expires_at` | timestamptz | now() + 5 min |
| `consumed_at` | timestamptz NULL | single use |

```json
{ "id": "o1", "email": "ava.chen@dimisi.io", "purpose": "login", "attempts": 0, "expiresAt": "2026-08-05T09:16:00Z" }
```

## 15. `password_resets`

| Field | Type |
| --- | --- |
| `id` | uuid PK |
| `user_id` | uuid FK |
| `token_hash` | text UNIQUE |
| `expires_at` | timestamptz (15 min) |
| `used_at` | timestamptz NULL |
| `requested_ip` | inet |

## 16. `sessions`

| Field | Type |
| --- | --- |
| `id` | uuid PK |
| `user_id` | uuid FK |
| `refresh_token_hash` | text UNIQUE |
| `device` / `browser` | text |
| `ip_address` | inet |
| `expires_at` | timestamptz |
| `revoked_at` | timestamptz NULL |
| `created_at` | timestamptz |

```json
{ "id": "se1", "device": "Desktop", "browser": "Chrome", "ip": "192.168.1.24", "expiresAt": "2026-09-04T09:11:00Z" }
```

---

## Indexing recommendations

| Table | Index |
| --- | --- |
| `users` | `email` (unique) |
| `employees` | `code` (unique), `department_id`, `points DESC` |
| `tasks` | `(status, category)`, `assignee_id`, `project_id`, `due_at` |
| `task_submissions` | `(status, submitted_at DESC)`, `task_id` |
| `notifications` | `(user_id, read_at, created_at DESC)`, `expires_at` |
| `audit_logs` | `(created_at DESC)`, `(category, created_at DESC)`, `actor_id` |
| `otp_codes` | `(email, purpose, expires_at)` |

## Retention

- `notifications`: purge where `expires_at < now()` (30-day rule).
- `otp_codes`: purge consumed/expired hourly.
- `audit_logs`: retain ≥ 24 months, archive beyond.
