# Changelog

All notable changes to the Dimisi Employee Management System.
Format based on [Keep a Changelog](https://keepachangelog.com/);
versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — Frontend Complete

### Added
- Full developer documentation set under `docs/`.
- Unified "Forgot password" 4-step wizard shared by the login page and Settings,
  with an isolated OTP channel and audit logging.
- OTP-protected password change in both Admin and Employee settings.
- Department management with correlated department → designation dropdowns.

### Changed
- Major refactor for maintainability: Reports (~800 → ~120 lines), Admin
  Dashboard (~470 → ~100 lines) and Notice Board (563 → ~80 lines) split into
  `src/components/reports/`, `src/components/admin-dashboard/` and
  `src/components/notices/`. UI verified pixel-identical.

### Fixed
- "Current password is incorrect" on a correct password — verification now
  accepts the password actually used at sign-in while `OPEN_ACCESS` is enabled.

---

## [0.9.5] — Responsive & Auth Hardening

### Added
- Mandatory email OTP as a second login factor (demo code `123456`).
- Notification system rework: role-aware triggers, 30-day auto-expiry,
  responsive feeds, delete/archive removed.

### Changed
- Complete mobile-first responsive rebuild (320 px → 1920 px+): global overflow
  guards, scrollable tabs, tables collapsing to cards, 44 px touch targets.
- Sidebar auto-closes on navigation in mobile drawer mode.

### Fixed
- Missing logo after export — all brand assets centralised in `src/lib/brand.ts`.

---

## [0.9.0] — Task System

### Added
- Task categories: Universal, Project and Direct assignment.
- First-come-first-served task pickup pool (`available-tasks.tsx`).
- Dedicated submission page: read-only brief, 20 MB multi-format proof upload,
  completion checklist.
- Admin Review Centre: approve / reject / remarks, proof download, metadata.
  Actions clear the queue and notify the employee; approvals award points.
- "View Task" detail dialog and "Submission Details" dialog.
- Audit Logs module with CSV / Excel / PDF export.
- Notice Board: admin CRUD + pinning, employee read-only view, header integration.

---

## [0.8.0] — Project Management

### Added
- Project module with `DMSPRJxxx` IDs, CRUD and archive.
- Project selector inside task creation.
- Deletion guards preventing removal of projects that still own tasks.

---

## [0.7.0] — Accounts, IDs & Profiles

### Added
- Standardised ID system: `DMSEMPyyNN`, `DMSADMNN`, `DMSDIRNN`, `DMSPRJxxx`.
- Frontend account creation with auto-generated IDs and mock credentials.
- Employee profile editing limited to bio and profile picture.
- Leaderboard, Activity, Notifications, Reports and Settings modules.

### Changed
- Roles displayed as job titles (e.g. "Frontend Developer") instead of raw roles.
- All lists sorted by date; permanent directors protected from deletion.

### Added (dev)
- `OPEN_ACCESS` bypass allowing any email/password to reach either panel.

---

## [0.5.0] — Employee & Task Management

### Added
- Employee, Admin and Task management modules: data tables, detail and edit
  views, creation forms with attachment upload.
- Admin dashboard (6 KPI cards + analytics) and Employee dashboard
  (welcome hero + performance trends).
- Sidebar and dashboard shell for both panels.

---

## [0.3.0] — Visual Identity

### Changed
- Iterated through Dark+Orange → high-contrast dark → monochrome → final
  **Gold & Black luxury editorial** identity (`#070707` background,
  `#C9A961` gold accent, serif display type).
- Architectural geometry: 5 px border radius (6 px for modals).
- Dimisi Technologies branding with metallic logo treatment.

---

## [0.1.0] — Initial Project Setup

### Added
- TanStack Start + React 19 + TypeScript + Tailwind CSS v4 scaffold.
- Design-token system in `src/styles.css`, dark/light theme provider.
- Mock data layer, auth context, base routing (`__root.tsx`, `login.tsx`).
- Core UI kit: stat cards, tables, dashboard shell, loading and skeleton states.

---

## [Unreleased]

### Planned — 1.1.0 · Backend Integration Phase 1
- [ ] Real authentication API (login, logout, refresh, `/auth/me`)
- [ ] Server-generated OTP with email delivery
- [ ] Employee and Admin CRUD endpoints
- [ ] Remove `OPEN_ACCESS` and `DEMO_OTP`

### Planned — 1.2.0 · Backend Integration Phase 2
- [ ] Projects, Tasks, atomic pickup, submissions and reviews
- [ ] Object storage for proof files and avatars

### Planned — 1.3.0 · Backend Integration Phase 3
- [ ] Notices, leaderboard, reports, audit logs, notifications, settings
- [ ] Server-side pagination, search and filtering

### Planned — 2.0.0
- [ ] Real-time notifications and review queue
- [ ] Granular permission matrix
- [ ] Test suite (Vitest + Playwright) and accessibility audit
- [ ] Internationalisation

<!--
Template for future entries:

## [x.y.z] — YYYY-MM-DD
### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security
-->
