# Tasks: Candidate Portal Integration

**Input**: spec.md, plan.md, research.md, contracts/ · **Tests**: REQUIRED (Constitution V)
Format: `- [ ] T### [P?] [US#?] Description with file path`

> ⛔ **Implementation has not started.** Phase 0 needs the owner's decisions and approval.

## Phase 0: Prerequisites (F0) — owner + backend

- [x] T001 Owner decides D1 (college/place), D2 (session storage), D3 (TA dashboard scope); record in research.md and resolve FR-013–FR-015 in spec.md — **D1 keep · D2 backend cookie · D3 include**
- [x] T002 Owner commits (or approves committing) the existing WIP: `(infotech)` route group, `components/tech/**`, layout/header/constants changes
- [ ] T003 Owner creates a dedicated GitHub repo for the frontend; fix `origin` (currently the backend repo)
- [ ] T004 Backend change request in hvk-home-backend: B1 httpOnly refresh cookie + CORS credentials, B2 optional college/place, B3 local port/CORS/reset-URL docs, B4 `GET /admin/staff`; merged with tests

## Phase 1: Setup (F1)

- [x] T005 Scripts: `typecheck`, `lint` (`eslint . --max-warnings 0`), `test`, `test:e2e`, `format:check` in package.json
- [x] T006 [P] Vitest + jsdom + Testing Library + MSW config (vitest.config.ts, tests/setup.ts, tests/msw/handlers.ts)
- [x] T007 [P] Playwright config + base fixture with API route mocking (playwright.config.ts, tests/e2e/fixtures.ts)
- [x] T008 [P] `.env.local.example`: `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`, `NEXT_PUBLIC_DEMO_VIDEO_URL`
- [x] T009 [P] CI workflow: typecheck, lint, unit, build, e2e, plus a guard that home files are unchanged (.github/workflows/ci.yml)

## Phase 2: Foundation (F2) — blocks all stories

- [ ] T010 API types mirroring backend DTOs and envelope in types/api.ts
- [ ] T011 `apiFetch` (envelope, `ApiError{status,code,message,fieldErrors}`, NETWORK_ERROR, refresh-once on 401 with de-duplicated refresh) in lib/api/client.ts
- [ ] T012 [P] Error-code → message map from contracts/api-consumed.md in lib/api/errors.ts
- [ ] T013 [P] Domain modules lib/api/{auth,candidate,onboarding,payments,exams,results}.ts
- [ ] T014 SessionProvider (in-memory access token, restore via refresh on load, sign-in/out, cross-tab logout via BroadcastChannel) in lib/session/session-provider.tsx
- [ ] T015 Journey table step → route/action in lib/journey.ts
- [ ] T016 `proxy.ts` optimistic redirect for portal paths (cookie presence) at repo root
- [ ] T017 `(portal)` layout with SessionGate + step router in app/(infotech)/(portal)/layout.tsx
- [ ] T018 Header: Sign in / Dashboard / Sign out states in components/layout/header.tsx
- [ ] T019 [P] Tests: client (envelope, field errors, refresh-once, network), journey table, session restore/logout in tests/unit/

## Phase 3: US1 Register (P1, F3)

- [ ] T020 [P] [US1] Zod schema mirroring the API (name 2–100, email, 10-digit mobile → +91, city/state 2–100, PIN `^[1-9][0-9]{5}$`, password 8–128 + confirm, acceptTerms true; college 2–150, place 2–100) in lib/validations.ts
- [ ] T021 [US1] Rewire components/home/registration-form.tsx: new fields, `POST /auth/register`, `setError` from fieldErrors, ACCOUNT_EXISTS → sign-in link, redirect to /onboarding
- [ ] T022 [P] [US1] Component tests: client validation, payload shape (+91), field errors, ACCOUNT_EXISTS, success redirect in tests/components/registration-form.test.tsx

## Phase 4: US2 Sign in / reset (P1, F3)

- [ ] T023 [P] [US2] /login page with Password and OTP tabs, `?next=` support in app/(infotech)/login/
- [ ] T024 [P] [US2] OTP form (request, 6-digit input, 60 s resend countdown) in components/portal/otp-form.tsx
- [ ] T025 [P] [US2] /forgot-password and /reset-password pages in app/(infotech)/
- [ ] T026 [P] [US2] Tests: login success/generic error/429, OTP flow + cooldown, forgot (same message), reset success/INVALID_TOKEN in tests/components/auth.test.tsx

## Phase 5: US3 Dashboard + US4 Demo (F4)

- [ ] T027 [US3] Journey stepper + primary action in components/portal/journey-stepper.tsx and app/(infotech)/(portal)/dashboard/page.tsx
- [ ] T028 [US4] Demo video page (Next enabled on `ended`, Skip always) in app/(infotech)/(portal)/onboarding/page.tsx
- [ ] T029 [P] [US3][US4] Tests: action per step, out-of-order redirect, complete/skip calls in tests/components/journey.test.tsx

## Phase 6: US5 Payment (P1, F5)

- [ ] T030 [US5] Razorpay loader + typed `openCheckout()` in lib/razorpay.ts
- [ ] T031 [US5] /payment page: fee from order, open Checkout, verify, dismissed/failed retry, verify-pending polling of `/payments/me`, already-paid redirect in app/(infotech)/(portal)/payment/page.tsx
- [ ] T032 [P] [US5] Tests with mocked `window.Razorpay`: success → verify → /exam; dismiss; payment.failed; INVALID_SIGNATURE → polling → paid; script load failure in tests/components/payment.test.tsx

## Phase 7: US6 Exam, feedback, thank-you + US7 Result, profile (F6)

- [ ] T033 [US6] /exam page: start link (new tab), "I've finished" claim, waiting state polling status in app/(infotech)/(portal)/exam/page.tsx
- [ ] T034 [US6] /feedback (star rating, comments ≤ 2000) and /thank-you pages
- [ ] T035 [US7] /result (pending/published) and /profile (edit name, city, state, PIN) pages
- [ ] T036 Retire legacy pages: /registration/callback → /dashboard, /exam/access/[token] → /login?next=/exam; remove payment-link/magic-link client code and old types
- [ ] T037 [P] [US6][US7] Tests: exam claim + polling, feedback once (FEEDBACK_EXISTS), result states, profile save in tests/components/
- [ ] T038 E2E: full journey register → demo skip → pay → exam → feedback → thank-you → result, plus sign-out guard, in tests/e2e/journey.spec.ts

## Phase 7b: US8 TA / admin dashboard (P2, F6b)

- [ ] T042 [US8] Role-aware routing: staff → /admin after sign-in; `(admin)` layout guard (ta/admin) and candidate-route guard for staff in app/(infotech)/(admin)/layout.tsx, lib/journey.ts
- [ ] T043 [P] [US8] TA API module + transition tables mirroring the backend (`LEAD_TRANSITIONS`, `FOLLOW_UP_TRANSITIONS`) in lib/api/admin.ts, lib/ta.ts
- [ ] T044 [US8] Leads list: status/date filters, pagination, total; URL query state in app/(infotech)/(admin)/admin/leads/page.tsx
- [ ] T045 [US8] Lead detail: candidate panel (incl. city, state, college, place), allowed-status menu, assign (me / staff picker via `GET /admin/staff`), next action date, notes timeline, INVALID_STATE reload in app/(infotech)/(admin)/admin/leads/[id]/page.tsx
- [ ] T046 [US8] Follow-ups list + update (in progress / done with outcome / cancelled) in app/(infotech)/(admin)/admin/follow-ups/page.tsx
- [ ] T047 [P] [US8] Tests: RBAC redirects both ways, filters → query params, allowed transitions only, assign, note, concurrent-edit handling, follow-up done in tests/components/admin.test.tsx
- [ ] T048 [US8] E2E: TA signs in → filters leads → assigns + contacts a lead → completes a follow-up in tests/e2e/admin.spec.ts

## Phase 8: Polish (F7)

- [ ] T039 [P] Accessibility pass (labels, aria-live errors, focus management on step changes); Lighthouse ≥ 95 on key pages
- [ ] T040 [P] README: setup with backend, env, scripts, architecture
- [ ] T041 Run quickstart.md Q1–Q8 against the real backend in Razorpay test mode

## Dependencies
- Phase 0 → everything. Phase 1 → Phase 2 → stories. US8 needs Phase 2 + backend B4.
- US1/US2 before US3–US7 (need a session). US5 before US6. Backend T004 before F3 if D2 = A.

## MVP
Phases 0–6 (register, sign-in, dashboard, demo, payment) = a candidate can pay and get the exam link.
Then Phase 7 (exam → result) and Phase 7b (TA dashboard), then polish.
