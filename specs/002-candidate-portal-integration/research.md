# Research: Candidate Portal Integration

## D1. College and place fields — owner decision
- **Options**: (a) keep both, which needs a backend change (B2); (b) drop both from the form.
- **Recommendation**: (a) keep them, because they are useful to the TA team. Both are optional in
  the backend so mobile clients are not forced to send them.

## D2. Session / refresh-token storage — owner decision
- **(A) Backend httpOnly cookie (recommended)**: the backend sets `refresh_token`
  (httpOnly, `SameSite=Lax`, `Secure` in prod, scoped to `/api/v1/auth`) on login, register,
  OTP verify and refresh. The browser calls `/auth/refresh` with `credentials: 'include'` on load
  to restore the session. The access token stays in memory. Mobile keeps using JSON-body tokens.
  `localhost:3000` → `localhost:4000` and `www.` → `api.` subdomains are same-site, so `Lax` works.
- **(B) Next.js route-handler proxy (BFF)**: no backend change, but every auth request comes from
  the Next server's IP. That defeats the backend's per-IP rate limits unless `X-Forwarded-For` is
  trusted, and trusting it lets direct callers spoof their IP.
- **(C) localStorage**: any XSS can steal a 30-day refresh token. Rejected by Constitution III.

## D3. TA / admin dashboard — owner decision
- **Recommendation**: defer it to feature **003-ta-dashboard**, because it has a different audience,
  roles and design. Feature 002 stays candidate-only.

## R1. Payment UX: Razorpay Checkout
- **Decision**: load `https://checkout.razorpay.com/v1/checkout.js` on `/payment` only (via
  `next/script`, `lazyOnload`). Open it with the `checkout` object from `POST /payments/orders`.
  In `handler(response)` call `POST /payments/verify`; listen for `payment.failed` and `ondismiss`.
- **Rationale**: this is the backend's design (spec 001, R8). The key id is publishable by design;
  the secret never leaves the backend.
- **Fallback**: if verify fails, poll `GET /payments/me` every 3 s for up to 60 s (webhook path).

## R2. Route protection
- **Decision**: (1) `proxy.ts` does an optimistic redirect to `/login?next=…` for portal paths when
  the session cookie is absent (Next 16 renamed middleware to proxy). (2) The `(portal)` layout's
  client `SessionGate` restores the session (`/auth/refresh`), loads `/onboarding/status` and
  redirects to the step's route if needed. The API remains the real authority (401/422).
- **Rationale**: Next docs advise using Proxy for optimistic checks only, not full authorization.

## R3. API client
- **Decision**: `apiFetch<T>(path, { method, body, auth })` returns `data`, or throws
  `ApiError { status, code, message, fieldErrors }`. On 401 with `auth: true` it calls
  `session.refresh()` once (deduplicating concurrent refreshes) and retries. Network failures map to
  `NETWORK_ERROR`. `fieldErrors` converts `details[].path` (`body.email` → `email`) for react-hook-form `setError`.

## R4. Forms & validation
- **Decision**: keep react-hook-form + Zod 3 (already installed). Schemas mirror backend rules. The
  phone field keeps the 10-digit UX and is sent as `+91` + digits.

## R5. Testing
- **Unit/component**: Vitest + jsdom + Testing Library + MSW, with handlers from
  `contracts/api-consumed.md`. Razorpay is mocked as `window.Razorpay`.
- **E2E**: Playwright against `next build && next start`, with the API mocked by `page.route`
  (deterministic, no backend needed in CI). One optional `@live` spec runs against a real local
  backend (manual).

## R6. CI
- **Decision**: GitHub Actions in the frontend repo: `npm ci` → `tsc --noEmit` →
  `eslint --max-warnings 0` → `vitest run --coverage` → `next build` → Playwright (chromium).
  A guard step fails if `app/page.tsx` or `components/tech/**` changed in the PR (Constitution IV).
- **Prerequisite**: the frontend needs its own GitHub repo (current `origin` is the backend repo).

## R7. Next.js 16 notes
- `middleware.ts` → `proxy.ts` (`export function proxy`).
- `next lint` was removed: the `lint` script becomes `eslint . --max-warnings 0`.
- Pages using `useSearchParams` need a `<Suspense>` boundary (already the pattern in the callback page).
