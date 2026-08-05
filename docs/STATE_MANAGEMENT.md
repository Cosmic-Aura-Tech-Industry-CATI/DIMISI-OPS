# State Management

---

## 1. Current architecture (frontend-only)

There is **no global state library**. State is layered:

| Layer | Mechanism | Files |
| --- | --- | --- |
| Session/auth | React Context + `localStorage` | `src/lib/auth.tsx` |
| Domain data | Module-level stores with `useSyncExternalStore` + `localStorage` | `src/lib/*-store.ts`, `src/lib/accounts.ts` |
| Server cache | `QueryClient` created but largely unused today | `src/router.tsx` |
| UI state | Local `useState` / `useReducer` | components |
| Form state | `react-hook-form` + `zod` | forms |
| URL state | Route params & search params | `src/routes/*` |
| Theme | Context + `localStorage` | `src/lib/theme.tsx` |

### Store pattern in use

```ts
const listeners = new Set<() => void>();
let state: State = initial;

function setState(next: State) {
  state = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function useStore() {
  return useSyncExternalStore(subscribe, () => state, () => emptyServerSnapshot);
}
```

> ⚠️ `getServerSnapshot` must return a stable empty value — never read
> `localStorage` during SSR or hydration will mismatch.

### localStorage keys

| Key | Owner |
| --- | --- |
| `poll-auth-user` | `auth.tsx` — current session user |
| `dimisi-accounts` | `accounts.ts` — created employees/admins + credentials |
| `dimisi-password-overrides` | `accounts.ts` — changed passwords |
| `dimisi-session-passwords` | `accounts.ts` — password used at sign-in |
| `dimisi-tasks` / `dimisi-projects` / `dimisi-departments` | task/project/department stores |
| `dimisi-submissions` / `dimisi-reviews` | submission + review stores |
| `dimisi-notices` / `dimisi-notifications` | notice + notification stores |
| `dimisi-audit-log` | audit log |
| `dimisi-profile` | profile overrides |

---

## 2. Target architecture (after backend integration)

```text
Server state  →  TanStack Query (source of truth for all remote data)
Session       →  AuthProvider hydrated from /auth/me, tokens in memory + httpOnly cookie
UI state      →  local component state
Form state    →  react-hook-form + zod
URL state     →  route params + search params (filters, pagination, tabs)
```

**Rule:** anything the server owns must live in React Query, never in a custom
store or context. Delete each `*-store.ts` as its domain is migrated.

### Query key conventions

```ts
['auth', 'me']
['employees', { page, q, department }]
['employees', id]
['employees', id, 'statistics']
['admins', { page }]
['departments']
['projects', { status }]
['projects', id]
['tasks', { category, status, assignee }]
['tasks', 'available']
['tasks', id]
['submissions', { status }]
['submissions', id]
['notices', { category }]
['leaderboard', { period }]
['reports', type, { from, to }]
['audit-logs', { page, filters }]
['notifications', { unread }]
['settings', 'preferences']
```

### Recommended cache policy

| Domain | `staleTime` | Refetch strategy |
| --- | --- | --- |
| Auth / current user | ∞ (invalidate on login/logout) | on window focus |
| Employees, admins, departments | 5 min | invalidate on mutation |
| Projects | 5 min | invalidate on mutation |
| Tasks (mine) | 30 s | on focus |
| **Available tasks (pickup pool)** | 0 | poll every 10–15 s or subscribe |
| Submissions / review queue | 15 s | invalidate on approve/reject |
| Leaderboard | 2 min | background refresh |
| Reports | 5 min | manual refresh button |
| Audit logs | 1 min | paginated, keepPreviousData |
| Notifications | 30 s | poll or SSE |
| Settings | 10 min | invalidate on save |

---

## 3. Per-domain guidance

### Authentication
- Access token in **memory** only; refresh token in an httpOnly cookie.
- Hydrate on boot via `GET /auth/me` inside `AuthProvider`.
- On 401: attempt one refresh, then hard-logout and clear the whole query cache.

### Current user
- Single query `['auth','me']`. Every component reads it through `useAuth()`; do not duplicate the user object into other stores.

### Employee data
- List: paginated query with server-side filters; keep filters in URL search params so views are shareable.
- Detail: separate query per `id`, prefetched on row hover.
- Mutations: optimistic update on the detail cache + invalidate the list.

### Admin data
- Same as employees. Permanent-director protection must be enforced server-side; the UI flag is a convenience only.

### Projects
- Cache the project list globally — the task form needs it. Prefetch it when the task form mounts.

### Tasks
- Split queries by view: `mine`, `available`, `all`.
- **Pickup is the critical concurrency path:** call the mutation, and on conflict (`409`) show "already claimed" and invalidate `['tasks','available']`.
- Never optimistically mark a pickup as successful.

### Task reviews / submissions
- Approve/reject → invalidate `['submissions']`, `['tasks']`, `['leaderboard']`, `['notifications']`, and the affected employee's `points`.

### Leaderboard
- Read-only, derived server-side from the points ledger. Never compute client-side once the API exists.

### Reports
- Ask the server for aggregates; do not download raw rows. `use-report-data.ts` becomes a thin query wrapper.
- Exports should hit `/reports/export` and stream a file.

### Notifications
- Poll every 30 s (or SSE). Mark-as-read mutation with optimistic unread-count decrement.
- Client must still hide anything past its 30-day expiry as a safety net.

### Settings
- Small object query; optimistic update with rollback on error.
- Theme stays client-only in `localStorage` (no round trip).

---

## 4. Storing API responses — rules

1. **Normalise by ID.** Store lists as IDs + a detail cache; avoid duplicating entities.
2. **Never persist server data to `localStorage`** after integration — it goes stale and leaks data on shared machines.
3. **Persist only:** theme, sidebar collapsed state, table column preferences, last-used filters.
4. **Invalidate, don't hand-patch**, unless the optimistic UX is worth the complexity.
5. **Clear the entire query cache on logout:** `queryClient.clear()`.

## 5. Migration checklist per store

- [ ] Create `src/lib/services/<domain>.service.ts` with typed fetchers.
- [ ] Add `queryOptions` factories next to the service.
- [ ] Replace the store's read hook with `useQuery`/`useSuspenseQuery`, keeping the same return shape.
- [ ] Replace write functions with `useMutation` + invalidation.
- [ ] Remove the `localStorage` persistence and the seed import from `mock-data.ts`.
- [ ] Delete the store file once no imports remain.
