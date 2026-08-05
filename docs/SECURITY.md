# Security Architecture

> ⚠️ **Current state:** authentication, OTP and password flows are **mock,
> client-side implementations** intended for UI development only. They provide
> **no real security**. Everything in this document marked *Target* must be
> implemented server-side before production use.

---

## 1. Current implementation vs target

| Concern | Today (mock) | Target (server) |
| --- | --- | --- |
| Credential check | `verifyCredentials()` in `src/lib/accounts.ts`, `OPEN_ACCESS = true` accepts anything | `POST /auth/login` with argon2id hash comparison + rate limiting |
| OTP | In-memory `Map`, fixed `DEMO_OTP = "123456"` | Server-generated, hashed, emailed, 5-min TTL, single use |
| Session | `localStorage['poll-auth-user']` | Access token in memory + refresh token in httpOnly `Secure` `SameSite=Strict` cookie |
| Route protection | Client-side redirect in layout routes | Server session check + role assertion before render |
| Password storage | Plaintext in `localStorage` | Argon2id hash, never returned by any endpoint |
| Audit | `logAudit()` writes to `localStorage` | Server-side append-only `audit_logs` table |

---

## 2. Authentication flow

```text
1. User picks portal (Admin / Employee) on /login
2. Submits email + password
3. [Target] Server verifies hash, checks status=active, rate-limits by IP+email
4. Server issues a short-lived "pendingAuth" token and sends an OTP by email
5. Client renders <otp-verification /> (6 digits, 5-min TTL, 5 attempts)
6. On correct OTP → server returns access token + sets refresh cookie
7. AuthProvider stores the user, redirects: admin → /admin, employee → /employee
8. Login is written to audit_logs (success or failure)
```

Files: `src/routes/login.tsx`, `src/components/otp-verification.tsx`,
`src/lib/accounts.ts`, `src/lib/auth.tsx`, `src/lib/otp.ts`.

### Hardening requirements
- Rate limit: 5 login attempts / 15 min per email **and** per IP.
- Generic error text ("Invalid credentials") — never reveal whether the email exists.
- Lock the account after repeated failures; notify by email.
- Reject login for `status != 'active'`.

---

## 3. OTP flow

| Property | Value |
| --- | --- |
| Length | 6 digits (`OTP_LENGTH`) |
| TTL | 5 minutes (`OTP_TTL_MS`) |
| Resend cooldown | 30 s (`OTP_RESEND_SECONDS`) |
| Max attempts | 5, then locked (`OTP_MAX_ATTEMPTS`) |
| Single use | Code deleted on success |
| Re-issue | A new send invalidates the previous code and resets counters |

**Three isolated channels** so flows never clobber each other:

| Channel | Module | Purpose |
| --- | --- | --- |
| `login` | `src/lib/otp.ts` | Second factor at sign-in |
| `password_change` | `src/lib/password-otp.ts` | Settings → change password |
| `password_reset` | `src/lib/recovery-otp.ts` (scoped `pwd-reset::<email>`) | Forgot-password wizard |

Rules:
- ✅ The code is **never** returned to the client or rendered in the UI.
- ✅ Dev-only console delivery is gated behind `import.meta.env.DEV`.
- 🎯 Target: store only a hash of the code; deliver via a transactional email provider; enforce per-email send throttling.

---

## 4. Forgot-password flow

4-step wizard (`src/components/password-recovery.tsx`), shared by
`/forgot-password` and Settings → Security:

```text
Step 1  Email verification   → POST /auth/forgot-password
Step 2  OTP verification     → POST /auth/forgot-password/verify → reset token
Step 3  New password         → POST /auth/reset-password
Step 4  Success              → "Password Changed Successfully" email + audit entry
```

- Always respond with success in Step 1, even for unknown emails (no enumeration).
- Reset token: single use, 15-minute TTL, bound to the user and the request IP.
- On success: revoke **all** sessions and force re-login.

---

## 5. Password reset & change

### Reset (`/reset-password`)
Consumes the recovery token, validates strength (`src/lib/password.ts`),
persists the new hash, revokes sessions, writes an audit log.

### Change (Settings → `change-password-card.tsx`)
```text
Current password → OTP verification → New password → forced sign-out
```
- Current password must be verified server-side (never trust the client check).
- Because `OPEN_ACCESS` accepts any password at login, the mock keeps the
  password used at sign-in (`rememberSignInPassword`) so the "current password"
  check behaves sensibly in demo mode. **Delete this once real auth exists.**

### Password policy (target)
Minimum 12 characters, mixed case + digit + symbol, blocked against a common-password
list, cannot match the previous 3 hashes.

---

## 6. Role-based access control

| Role | Capabilities |
| --- | --- |
| **Director** (`DMSDIRxx`, permanent) | Everything, incl. creating/removing admins; cannot be deleted |
| **Admin** (`DMSADMxx`) | Employees, departments, projects, tasks, reviews, notices, reports, audit logs |
| **Employee** (`DMSEMPyyNN`) | Own tasks, pickup, submissions, points, leaderboard, notices (read-only), own profile/settings |

Rules:
- 🎯 Roles must live in their **own table** (`users.role` + a dedicated roles table
  if permissions expand). Never derive authorisation from client-side storage.
- 🎯 Every endpoint re-checks the role — the UI hiding a button is not authorisation.
- 🎯 Ownership checks: an employee may only read/submit their own tasks and submissions.

## 7. Protected routes

Every `/admin/*` and `/employee/*` route is protected. Today the gate is the
layout route (`admin.tsx`, `employee.tsx`) redirecting via `useAuth()`.

Target: a pathless `_authenticated` layout performing a server-side session
check, plus a role assertion per subtree. See `ROUTES.md §4`.

> ⚠️ Client-side redirects are UX, not security. Data must be protected at the API.

---

## 8. Session management

| Aspect | Target |
| --- | --- |
| Access token | JWT, 15 min, held in memory only |
| Refresh token | Opaque, 30 days, httpOnly + Secure + SameSite=Strict cookie, rotated on use |
| Reuse detection | Rotated-token reuse revokes the whole session family |
| Device list | `sessions` table records device, browser, IP, last seen |
| Logout | Revoke refresh token server-side + `queryClient.clear()` |
| Global sign-out | Revoke all sessions on password change/reset |
| Idle timeout | 30 min inactivity warning → auto logout |

## 9. Token storage

| Storage | Verdict |
| --- | --- |
| `localStorage` | ❌ XSS-readable — do not store tokens (current mock does; must change) |
| `sessionStorage` | ❌ Same exposure |
| In-memory JS variable | ✅ Access token |
| httpOnly cookie | ✅ Refresh token |

## 10. Email verification

- New accounts should be created `email_verified_at = NULL` and receive a
  verification link (24 h, single use).
- Unverified accounts may sign in but should be restricted from sensitive actions
  until verified.
- Email changes require confirmation on **both** the old and new address.

## 11. Audit logging

`logAudit()` (`src/lib/audit-log.ts`) is called on every mutation. Categories:
`authentication`, `employee`, `admin`, `task`, `project`, `notice`, `department`,
`settings`.

Each entry records actor name + code, action, target, details, status, and (target)
IP and user-agent. Export via `src/lib/audit-export.ts` (CSV / Excel / PDF).

Requirements:
- Append-only; no update or delete endpoints.
- Written server-side inside the same transaction as the mutation.
- Never log passwords, OTP codes, tokens, or full file contents.
- Retain ≥ 24 months.

---

## 12. Security best practices checklist

**Transport & headers**
- [ ] HTTPS only, HSTS enabled
- [ ] CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] CORS restricted to known origins

**Input & data**
- [ ] Zod validation on client **and** server
- [ ] Parameterised queries only (no string-built SQL)
- [ ] Output encoding; never `dangerouslySetInnerHTML` with user content
- [ ] File uploads: MIME + magic-byte check, 20 MB cap, virus scan, served from a
      separate origin with `Content-Disposition: attachment`

**Access**
- [ ] Server-side RBAC on every endpoint
- [ ] Ownership checks on all `:id` resources
- [ ] Rate limiting on auth, OTP, upload and export endpoints
- [ ] Idempotency on task pickup and submission approval

**Secrets**
- [ ] No secrets in client bundles or the repo
- [ ] Rotate JWT and email keys periodically

**Pre-production blockers**
- [ ] `OPEN_ACCESS = false`
- [ ] `DEMO_OTP = null`
- [ ] Demo credential hint removed from the login page
- [ ] Plaintext password persistence removed from `src/lib/accounts.ts`
