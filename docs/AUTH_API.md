# Authentication API Layer

Production-ready Axios + TanStack Query stack for the auth endpoints.
The existing mock auth (`src/lib/auth.tsx`) is untouched — swap screens over to
`@/auth` when the backend is live.

## Folder structure

```
src/
  api/
    config.ts        # VITE_API_BASE_URL, timeout, credentials
    endpoints.ts     # every path in one place
    client.ts        # axios instance + request/response interceptors + http helper
    token-store.ts   # access/reset token storage (memory + sessionStorage)
    errors.ts        # ApiError normalisation
    query-keys.ts    # centralised query keys
  services/
    auth.service.ts  # one typed function per endpoint
  hooks/api/
    use-auth-api.ts  # one React Query hook per endpoint
  auth/
    auth-context.tsx # AuthProvider + useAuthContext
    require-auth.tsx # role-aware render guard
    index.ts         # public barrel
  types/
    api.ts, auth.ts  # request/response contracts
```

## Configuration

```
# .env
VITE_API_BASE_URL=https://api.example.com
```

No URL is ever hardcoded; `.env.example` documents the variable.

## Auth modes

Each request declares `authMode`:

| mode | attaches | used by |
| --- | --- | --- |
| `none` | nothing | `/`, login, verify-login, resend-otp, refresh, forget-password, verify-reset-otp |
| `bearer` (default) | `Authorization: Bearer <accessToken>` | create-user (Director), logout |
| `reset` | `Authorization: Bearer <resetToken>` | reset-password |

`withCredentials: true` is always on, so the httpOnly refresh cookie reaches
`POST /api/v1/auth/refresh`.

## Interceptors

- **Request** — attaches the correct credential for the declared `authMode`.
- **Response** — on `401` for a bearer request it calls `/auth/refresh` once
  (de-duplicated across concurrent failures), retries the original request, and
  otherwise clears tokens and notifies `AuthProvider`. All errors are rejected as
  a normalised `ApiError { status, message, code?, fieldErrors? }`.

## Hooks

```tsx
import { useLogin, useVerifyLogin } from "@/auth";

const login = useLogin();
login.mutate({ email, password }, { onSuccess: () => setStep("otp") });
login.isPending; login.isSuccess; login.error?.message;
```

Available: `useHealth`, `useLogin`, `useVerifyLogin`, `useResendOtp`,
`useRefreshSession`, `useCreateUser`, `useLogout`, `useForgetPassword`,
`useVerifyResetOtp`, `useResetPassword`.

## Context

```tsx
import { AuthProvider, useAuthContext, RequireAuth } from "@/auth";

// mount inside QueryClientProvider (src/routes/__root.tsx)
<AuthProvider>{children}</AuthProvider>

const { user, status, isAuthenticated, isPending, error, login, verifyLogin, logout, hasRole } =
  useAuthContext();

<RequireAuth roles="director" fallback={<Spinner />} deniedFallback={<NoAccess />}>
  <CreateUserForm />
</RequireAuth>
```

## Adding an endpoint

1. Add the path to `src/api/endpoints.ts`.
2. Add request/response types in `src/types/`.
3. Add a service function using `http.*` with the right `authMode`.
4. Add a hook in `src/hooks/api/`.
