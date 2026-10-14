# Implementation Plan: Candidate Portal Integration

**Branch**: `002-candidate-portal-integration` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

## Summary

Rewire the candidate-facing part of the Next.js site to the Candidate Platform API (backend spec
001). The work covers: a typed API client and session layer; account registration on the existing
`/registration` page; sign-in (password and OTP) and password reset; a step-driven dashboard;
demo video; Razorpay Checkout payment; and exam, feedback, thank-you, result and profile pages.
Legacy payment-link and magic-link pages are retired. The home page is untouched. Research and
decisions: [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19, Next.js 16.3 App Router

**Primary Dependencies**: existing: react-hook-form, zod 3, @hookform/resolvers, framer-motion,
lucide-react, tailwind 3. New dev dependencies: vitest, @testing-library/react, @testing-library/user-event,
jsdom, msw, @playwright/test

**Storage**: none client-side except the in-memory access token; refresh token in an httpOnly
cookie (decision D2)

**Testing**: Vitest + Testing Library + MSW (component/unit); Playwright with the API mocked via
`page.route` (E2E)

**Target Platform**: modern evergreen browsers, mobile first (≥ 360 px)

**Project Type**: web frontend (separate repo) consuming a REST API

**Performance Goals**: registration/login pages LCP < 2.5 s on 4G; no additional JS on the home page

**Constraints**: no secrets in the browser; home page unchanged; works with the backend's CORS allowlist

**Scale/Scope**: ~12 routes, 1 API client, ~20 components

## Constitution Check

| Principle | How the plan complies | Status |
|---|---|---|
| I. Backend is source of truth | Every protected page loads `/onboarding/status` and routes by step; no client-side state machine beyond display | PASS |
| II. Typed single API client | `lib/api/client.ts` + per-domain modules; envelope and error mapping in one place | PASS |
| III. Secure sessions | Access token in memory; refresh in a backend httpOnly cookie (D2 = A, change B1); payment confirmed only by API | PASS |
| IV. Home page out of scope | No edits under `app/page.tsx`, `components/tech/**`; CI check guards it | PASS |
| V. Test-backed | Vitest + MSW per story; Playwright journey; CI gates | PASS |
| VI. Accessible & consistent | Reuse `components/ui`, form a11y patterns, dark mode | PASS |

## Project Structure

### Documentation

```text
specs/002-candidate-portal-integration/
├── spec.md · plan.md · research.md · quickstart.md · tasks.md
├── contracts/
│   ├── api-consumed.md        # backend endpoints used + error-code → message map
│   └── routes.md              # frontend route map, guards, step routing
└── checklists/requirements.md
```

### Source Code (changes)

```text
app/
├── page.tsx                                  # UNCHANGED (home)
└── (infotech)/
    ├── registration/page.tsx                 # keeps marketing sections + updated form
    ├── registration/callback/                # → redirect to /dashboard (legacy)
    ├── exam/access/[token]/                  # → redirect to /login (legacy)
    ├── login/ · forgot-password/ · reset-password/
    ├── (admin)/admin/                        # TA dashboard (role ta/admin): leads, leads/[id], follow-ups
    └── (portal)/                             # route group behind <RequireSession>
        ├── layout.tsx                        # session guard + step router
        ├── dashboard/ · onboarding/ · payment/ · exam/
        └── feedback/ · thank-you/ · result/ · profile/
components/
├── home/registration-form.tsx                # rewired to POST /auth/register
└── portal/                                   # new: stepper, video player, checkout button,
                                              #      otp form, rating input, status cards
lib/
├── api/client.ts                             # fetch wrapper, envelope, refresh-once, ApiError(code, fields)
├── api/{auth,candidate,onboarding,payments,exams,results}.ts
├── api/errors.ts                             # error.code → message map
├── session/session-provider.tsx              # in-memory access token, restore on load, logout
├── journey.ts                                # step → route/action table
├── razorpay.ts                               # loads checkout.js, typed open()
└── validations.ts                            # updated Zod schemas mirroring the API
proxy.ts                                      # optimistic redirect for protected paths (cookie presence)
tests/  unit/ · components/ · e2e/ · msw/handlers.ts
.github/workflows/ci.yml                      # typecheck, lint, test, build, e2e
```

**Structure Decision**: Keep the existing `(infotech)` route group and design system. Add a nested
`(portal)` group whose layout enforces the session and journey routing, so each page stays small.

## Milestones

| # | Milestone | Stories | Exit criteria |
|---|---|---|---|
| F0 | Prerequisites: owner decisions D1–D3, WIP committed, own Git remote, backend change request (cookie session, college/place if kept, CORS credentials) | — | decisions recorded; backend CR merged |
| F1 | Tooling: Vitest/RTL/MSW, Playwright, zero-warning ESLint, CI workflow, env example | — | CI green on an empty test |
| F2 | Foundation: API client, error map, session provider, proxy.ts, portal layout + journey router, header sign-in/out | US2 (part), US3 (part) | client + session tests pass |
| F3 | Registration + sign-in + OTP + forgot/reset | US1, US2 | form/auth tests pass |
| F4 | Dashboard + demo video | US3, US4 | routing tests for every step |
| F5 | Payment via Razorpay Checkout | US5 | checkout success/failure/verify-pending tests |
| F6 | Exam, feedback, thank-you, result, profile; retire legacy routes | US6, US7 | E2E journey green |
| F6b | TA dashboard: role guard, leads list/detail/update, follow-ups | US8 | TA E2E + RBAC tests green |
| F7 | Polish: a11y pass, Lighthouse, README, quickstart validation against the real backend | all | SC-001…SC-005 |

## Backend change request (raised in hvk-home-backend spec 001)

Required for this feature (decisions D1 = keep, D2 = A, D3 = include → B1–B4 all needed):

| # | Change | Needed when |
|---|---|---|
| B1 | Web session cookie: `register/login/otp/refresh` also set an httpOnly `refresh_token` cookie (`SameSite=Lax`, `Secure` in prod, `Path=/api/v1/auth`); `refresh`/`logout` accept the cookie when the body has no token; CORS `credentials: true` | D2 = A (recommended) |
| B2 | Optional `college` (2–150) and `place` (2–100) on register/profile/DTO/TA summary | D1 = keep |
| B3 | Docs: local `PORT=4000`, `CORS_ORIGINS=http://localhost:3000`, `PASSWORD_RESET_URL=http://localhost:3000/reset-password` | always |
| B4 | `GET /admin/staff` → `[{ id, fullName, role }]` for the lead-assignment picker (role ta/admin, audited) | D3 = include |

## Complexity Tracking

| Item | Why needed | Simpler alternative rejected because |
|---|---|---|
| Nested `(portal)` route group | One place for session guard + step routing | Per-page guards duplicate logic and drift |
| MSW + Playwright | Constitution V; backend is a separate service | Testing against a live backend in CI needs DB/Redis infra per run |
