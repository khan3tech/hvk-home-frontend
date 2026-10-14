# HVK Infotech — website & candidate portal

Next.js 16 (App Router) + React 19 + Tailwind. One site, two parts:

| Part | Routes | Notes |
|---|---|---|
| **HVK landing (home)** | `/` | `app/page.tsx`, `components/tech/**`. Out of scope for portal work; CI fails if a PR changes it. |
| **Candidate portal** | `/registration`, `/login`, `/forgot-password`, `/reset-password`, `/dashboard`, `/onboarding`, `/payment`, `/exam`, `/feedback`, `/thank-you`, `/result`, `/profile` | Talks to the Candidate Platform API (`hvk-home-backend`). |
| **TA dashboard** | `/admin/leads`, `/admin/leads/[id]`, `/admin/follow-ups` | Staff accounts only (`ta`/`admin`). |

Built spec-first with [GitHub Spec Kit](https://github.com/github/spec-kit). See
[`specs/002-candidate-portal-integration/`](specs/002-candidate-portal-integration/) for the spec, plan, routes, API mapping and tasks.

## Run locally (with the backend)

1. **Backend** (`hvk-home-backend`), in its `.env`:
   ```
   PORT=4000
   CORS_ORIGINS=http://localhost:3000
   PASSWORD_RESET_URL=http://localhost:3000/reset-password
   ```
   Then run `npm run dev`. Run `npm run dev:worker` too, with Redis, if you want the background emails and follow-ups.
2. **Frontend:**
   ```bash
   npm ci
   cp .env.local.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
   npm run dev                        # http://localhost:3000/registration
   ```
3. **Staff login for the TA dashboard** (run in the backend repo):
   ```bash
   npm run seed:admin -- --email ta@example.com --password 'Change-me-123' --role ta --name "TA User" --phone +919000000001
   ```

Payments use **Razorpay Checkout**. The backend creates the order and returns the publishable key ID. Use Razorpay test keys in the backend `.env` and a [test card](https://razorpay.com/docs/payments/payments/test-card-details/).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint, zero warnings |
| `npm test` / `test:coverage` | Vitest + Testing Library + MSW (API mocked) |
| `npm run test:e2e` | Playwright on a production build, API mocked; includes axe accessibility checks (run `npx playwright install chromium` once) |

CI (`.github/workflows/ci.yml`) runs all of these on every PR, plus the home-page guard.

## How the portal works

- **API client** (`lib/api/`): one typed `apiFetch`. It reads the `{ data, meta }` / `{ error }` envelope, maps error codes to friendly messages (`lib/api/errors.ts`), and attaches API field errors to form fields.
- **Session** (`lib/session/session-provider.tsx`):
  - The access token is kept **in memory only**. The refresh token is an **httpOnly cookie** set by the API (`X-Session-Mode: cookie`), so page scripts can never read it.
  - On load, the session is restored with `POST /auth/refresh`.
  - Refreshes are serialized across tabs with Web Locks, because the API revokes a session if a rotated refresh token is reused. Sign-out is synced across tabs.
  - Only a `401 UNAUTHENTICATED` triggers a refresh.
- **Routing:**
  - `proxy.ts` does a fast redirect to `/login` when the non-secret `hvk_signed_in` hint cookie is missing.
  - `PortalGate` (`components/portal/portal-gate.tsx`) makes the real decision. It keeps staff and candidates in their own areas and sends candidates to the page for their onboarding step (`lib/journey.ts`).
- **Payment** (`components/portal/payment.tsx`, `lib/razorpay.ts`):
  - The order is created on page load, and the API reuses an open order.
  - Success is confirmed only by `POST /payments/verify`. If verification fails, the page polls `GET /payments/me` to catch a webhook-confirmed payment.
- **Exam completion** comes only from the exam provider, through the API. "I've finished" just records a claim and waits.

## Project layout

```
app/page.tsx                      home (unchanged by portal work)
app/(infotech)/                   portal pages + shared header/footer (SessionProvider lives here)
  (portal)/                       candidate pages behind PortalGate
  (admin)/admin/                  TA dashboard behind PortalGate (role ta/admin)
components/portal/ · components/admin/ · components/home/registration-form.tsx
lib/api/ · lib/session/ · lib/journey.ts · lib/razorpay.ts · lib/ta.ts · lib/validations.ts
proxy.ts                          optimistic auth redirect (Next 16 proxy)
tests/unit · tests/components · tests/e2e · tests/msw
```
