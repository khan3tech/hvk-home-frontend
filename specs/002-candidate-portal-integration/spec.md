# Feature Specification: Candidate Portal Integration with the Candidate Platform API

**Feature Branch**: `002-candidate-portal-integration`

**Created**: 2026-10-14

**Status**: Clarified 2026-10-14 (D1 keep college/place · D2 backend httpOnly cookie · D3 TA dashboard included). Implementation waits for the owner's WIP commit.

**Input**: User description: "Update the frontend (`hvk-landing-page-frontend`) according to the
backend (`hvk-home-backend`, spec 001), except the home page."

## Context: current frontend vs. backend

| Concern | Frontend today | Backend (spec 001) |
|---|---|---|
| Registration | Passwordless: name, email, phone, college, place, city, state, PIN | Account: fullName, email, phone, city, state, PIN, **password**, **acceptTerms** (no college/place) |
| Sign-in | None | Email/phone + password, mobile OTP, refresh, logout, forgot/reset |
| Onboarding | None | Demo video step: complete or skip |
| Payment | Hosted **Payment Link** → `/registration/callback` | **Razorpay Checkout** with a server-created order, then `POST /payments/verify` |
| Exam access | One-time **magic-link token** `/exam/access/[token]` | Signed-in `GET /exams/current` returns the exam link |
| Feedback / thank-you / result | None | Feedback once per completed attempt; result published later |
| Response format | `{ success, data, error }` | `{ data, meta }` / `{ error: { code, message, details }, meta }` |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register an account (Priority: P1)

On `/registration` the candidate fills in the registration form (existing design) with full name,
email, mobile, city, state, PIN code, a password (with confirmation) and terms acceptance. On
success they are signed in and taken straight to the demo video.

**Why this priority**: Entry point of the whole journey; today's form calls endpoints that no
longer exist.

**Independent Test**: Submit the form against a mocked API, then assert the request body, the
signed-in state and the redirect to `/onboarding`.

**Acceptance Scenarios**:

1. **Given** valid details, **When** the candidate submits, **Then** the account is created, they
   are signed in and land on `/onboarding`.
2. **Given** the API returns `ACCOUNT_EXISTS`, **Then** the form shows "An account with these
   details already exists" with a link to sign in.
3. **Given** the API returns `VALIDATION_ERROR` with `details`, **Then** each message appears
   under the matching field.
4. **Given** client-side errors (invalid PIN, weak or mismatched password, terms unchecked),
   **Then** submission is blocked with inline messages and no request is sent.

---

### User Story 2 - Sign in, stay signed in, sign out (Priority: P1)

A returning candidate signs in with email or phone plus password, or with a mobile OTP. They can
reset a forgotten password. The session survives page reloads and expires safely; signing out
ends it.

**Independent Test**: Run each sign-in method against a mocked API, reload the page and confirm
the session is restored, then sign out and confirm protected pages redirect to `/login`.

**Acceptance Scenarios**:

1. **Given** correct credentials, **When** signing in, **Then** the candidate lands where their
   journey left off (see US5).
2. **Given** wrong credentials, **Then** one generic error is shown.
3. **Given** the OTP option, **When** the candidate requests a code and enters it, **Then** they
   are signed in. The resend button respects the 60-second cooldown, and expired or wrong codes
   show an error.
4. **Given** "Forgot password", **When** an email is submitted, **Then** the same confirmation is
   shown whether or not the account exists. **When** the emailed link `/reset-password?token=…`
   is used, **Then** the password changes and the candidate is asked to sign in.
5. **Given** a signed-in candidate reloads the page, **Then** the session is restored without
   asking for a password. **Given** they sign out, **Then** protected pages redirect to `/login`.

---

### User Story 3 - Resume the journey from a dashboard (Priority: P1)

After sign-in, `/dashboard` shows a stepper (Registered → Demo → Payment → Exam → Feedback →
Result) driven by the API's onboarding step, with one primary action for the current step.
Visiting a step's page out of order redirects to the right step.

**Independent Test**: For every onboarding step returned by the mocked API, check the dashboard
action and the redirect rules.

**Acceptance Scenarios**:

1. **Given** step `demo_pending`, **Then** the primary action is "Watch demo" (`/onboarding`).
2. **Given** step `fee_pending`, **Then** the action is "Pay registration fee" (`/payment`).
3. **Given** step `exam_ready` or `exam_in_progress`, **Then** the action is "Go to exam" (`/exam`).
4. **Given** step `exam_completed`, **Then** the action is "Give feedback"; **given**
   `feedback_submitted`, it is "View result status"; **given** `completed`, it is "View result".
5. **Given** a candidate at `fee_pending` opens `/exam`, **Then** they are redirected to `/payment`.

---

### User Story 4 - Watch or skip the demo video (Priority: P2)

`/onboarding` plays the demo video. "Next" is enabled when the video ends; "Skip" is always
available. Both record the action through the API and continue to payment.

**Acceptance Scenarios**:

1. **Given** the video ended, **When** Next is clicked, **Then** `POST /onboarding/demo/complete`
   is called and the candidate goes to `/payment`.
2. **When** Skip is clicked, **Then** `POST /onboarding/demo/skip` is called and the candidate
   goes to `/payment`.

---

### User Story 5 - Pay the registration fee and get the exam link (Priority: P1)

`/payment` shows the fee (amount from the API, never hard-coded) and opens Razorpay Checkout
prefilled with the candidate's details. After payment the app verifies it with the API, then shows
the exam link (also emailed) and moves the candidate to `/exam`.

**Independent Test**: Simulate the Checkout `handler` callback with a mocked Razorpay object;
assert that `/payments/verify` is called and the success UI appears.

**Acceptance Scenarios**:

1. **When** "Pay ₹499" is clicked, **Then** `POST /payments/orders` is called and Checkout opens
   with the returned `keyId`, `orderId`, `amount`, `currency` and `prefill`.
2. **Given** Checkout succeeds, **Then** `POST /payments/verify` is called with the three
   `razorpay_*` fields. On success the candidate is shown "Payment successful" and taken to `/exam`.
3. **Given** the candidate closes Checkout or the payment fails, **Then** a retry option is shown
   and nothing is marked paid.
4. **Given** verification fails (`INVALID_SIGNATURE` or a network error), **Then** a "We're
   confirming your payment" state polls `GET /payments/me` for up to 60 seconds before showing
   support guidance. This covers the case where the webhook confirms the payment later.
5. **Given** the candidate has already paid, **Then** `/payment` redirects to `/exam`.

---

### User Story 6 - Exam, feedback and thank-you (Priority: P2)

`/exam` shows "Start exam" (opens the exam link in a new tab) and "I've finished". Completion
itself is confirmed by the exam provider, so the page shows a waiting state until the step becomes
`exam_completed`. It then moves to `/feedback` (star rating, answers, comments) and finally to
`/thank-you`.

**Acceptance Scenarios**:

1. **Given** step `exam_ready`, **Then** "Start exam" links to `examUrl` from `GET /exams/current`.
2. **When** "I've finished" is clicked, **Then** `POST /exams/attempts/:id/complete` is called and
   the page polls status until the provider confirms completion.
3. **Given** `exam_completed`, **When** feedback (rating 1–5, comments up to 2000 characters) is
   submitted, **Then** `/thank-you` is shown. A second submission shows "Feedback already received".

---

### User Story 7 - Result and profile (Priority: P3)

`/result` shows "Your result will be emailed within 24 hours of completing the exam" until
published, then shows the score and outcome. `/profile` shows the candidate's details and lets them
edit their name, city, state and PIN code.

**Acceptance Scenarios**:

1. **Given** `GET /results/me` returns `null` or `status: pending`, **Then** the pending message
   is shown; **given** `published`, **Then** score and outcome are shown.
2. **When** the profile is saved with valid values, **Then** `PATCH /candidates/me` is called and
   the updated values appear.

---

### User Story 8 - TA / admin dashboard (Priority: P2)

Staff users (role `ta` or `admin`, created with the backend `seed:admin` script) sign in on the
same `/login` page and land on `/admin`. They can list Talent Acquisition leads (filter by status
and date, paginated), open a lead to see the candidate's details (name, email, phone, city,
state, college, place, onboarding step), change its status (only allowed transitions are offered),
assign it to themselves or another staff member, set the next action date, and add notes. They
also work through the list of unpaid-payment follow-ups (mark in progress or done with an outcome).

**Why this priority**: TA's daily tool for converting registrations into paid candidates.

**Independent Test**: With a mocked API, sign in as `ta`, list and filter leads, update one, and
add a note; confirm a candidate account cannot open `/admin` and staff cannot open candidate pages.

**Acceptance Scenarios**:

1. **Given** a `ta` user signs in, **Then** they land on `/admin/leads`; **given** a candidate
   opens `/admin`, **Then** they are redirected to `/dashboard`.
2. **When** filtering by status or date range or changing page, **Then** the list calls
   `GET /admin/ta-leads` with matching query parameters and shows the total.
3. **Given** a lead in status `new`, **Then** the status menu offers only `queued`, `assigned` and
   `closed`. **When** saved, **Then** `PATCH /admin/ta-leads/:id` is called and the timeline shows
   the change and any note.
4. **When** "Assign to me" or a staff member from the list (`GET /admin/staff`) is chosen,
   **Then** the lead shows that assignee.
5. **Given** the follow-ups tab, **Then** open follow-ups are listed oldest first; **when** one is
   marked done with an outcome, **Then** it leaves the open list.
6. **Given** the API returns `INVALID_STATE` (a concurrent edit), **Then** the UI reloads the lead
   and shows "This lead was updated by someone else."

### Edge Cases

- The access token expires mid-session: the client refreshes once and retries; if refresh fails
  the candidate is sent to `/login?next=<current path>`.
- The API is unreachable: a friendly "Could not reach the server" message with retry; no blank screens.
- 429 `RATE_LIMITED`: "Too many attempts, please wait" without leaking which field was wrong.
- The Razorpay script fails to load (ad-blocker or offline): show guidance instead of a broken button.
- Double-clicked submit buttons: buttons disable while a request is in flight.
- Old links: `/registration/callback` and `/exam/access/[token]` (legacy flows) redirect to
  `/dashboard` (or `/login`) with a short notice.
- Two tabs open: signing out in one ends the session for the other on its next API call.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The registration form MUST send exactly the API's register contract, with mobile
  normalized to `+91XXXXXXXXXX`, and MUST collect password, confirmation and terms acceptance.
- **FR-002**: Client validation MUST mirror the API: name 2–100; valid email; 10-digit Indian
  mobile; city and state 2–100; PIN `^[1-9][0-9]{5}$`; password 8–128.
- **FR-003**: The app MUST provide `/login` (password and OTP), `/forgot-password` and
  `/reset-password`, and sign-out from the header.
- **FR-004**: Sessions MUST persist across reloads without storing refresh tokens in JS-readable
  storage, and MUST refresh access tokens transparently (one retry per request).
- **FR-005**: Protected routes (`/dashboard`, `/onboarding`, `/payment`, `/exam`, `/feedback`,
  `/thank-you`, `/result`, `/profile`) MUST require a session and MUST route by onboarding step.
- **FR-006**: Payment MUST use Razorpay Checkout with the order returned by the API, and success
  MUST be confirmed only by `POST /payments/verify` (or `GET /payments/me` showing `paid`).
- **FR-007**: The fee amount and currency MUST be displayed from the API's response, never hard-coded.
- **FR-008**: The exam link MUST come only from `GET /exams/current`.
- **FR-009**: API errors MUST be mapped to user-friendly messages by `error.code`; field errors
  MUST come from `VALIDATION_ERROR.details`.
- **FR-010**: The legacy payment-link callback and magic-link exam access pages MUST be retired
  in favour of redirects.
- **FR-011**: The home page (`app/page.tsx`, `components/tech/**`) MUST remain unchanged.
- **FR-012**: Configuration MUST come from env: `NEXT_PUBLIC_API_BASE_URL` and
  `NEXT_PUBLIC_DEMO_VIDEO_URL`; the Razorpay key id comes from the order response.
- **FR-013**: The registration form MUST keep College (2–150) and Place/locality (2–100) and send
  them to the API (stored by backend change B2; optional in the API, required in this form).
- **FR-014**: The refresh token MUST be an httpOnly cookie set by the backend (change B1); the
  frontend calls auth endpoints with `credentials: 'include'` and keeps the access token in memory only.
- **FR-015**: The app MUST provide a TA/admin dashboard (`/admin/**`) for roles `ta` and `admin`:
  lead list (filters, pagination), lead detail (status transitions per the backend table, assign,
  next action, notes) and follow-ups list/update (US8). Candidates MUST NOT reach `/admin/**`, and
  staff are routed to `/admin` after sign-in.

### Key Entities (client side)

- **Session**: access token (in memory), expiry, candidate summary; refresh token held by an
  httpOnly cookie (see FR-014).
- **Candidate profile**: mirrors `CandidateDTO`.
- **Journey step**: `onboardingStep` from the API → route and primary action.
- **TA lead / follow-up**: mirrors `TaLeadDTO` / `FollowUpDTO`, including the allowed status transitions.
- **Checkout order**: `{ keyId, orderId, amount, currency, name, prefill }` from the API.

## Success Criteria *(mandatory)*

- **SC-001**: A new candidate can go from `/registration` to holding an exam link in under
  5 minutes of their own time.
- **SC-002**: 0 screens show stale or contradictory state: every protected page derives its state
  from the API on load.
- **SC-003**: 100% of API error codes in the backend contract have a user-facing message.
- **SC-004**: Lighthouse accessibility ≥ 95 on registration, login, payment and dashboard.
- **SC-005**: The main journey passes in the end-to-end test on every PR.

## Assumptions

- **Local ports**: Next.js dev on `http://localhost:3000`; backend on `http://localhost:4000` (set
  backend `PORT=4000` and `CORS_ORIGINS=http://localhost:3000`, and point
  `PASSWORD_RESET_URL` to `http://localhost:3000/reset-password`).
- **Demo video**: a hosted MP4/YouTube URL is provided via `NEXT_PUBLIC_DEMO_VIDEO_URL`
  (placeholder until the owner supplies one).
- **Phone numbers**: Indian mobiles only in the UI (+91), matching the existing form.
- **Separate repo**: the frontend gets its own GitHub repository; its current `origin` points to
  the backend repo and must be corrected by the owner.
- **WIP**: the owner's uncommitted `(infotech)` restructuring and `components/tech` work is the
  baseline. It is committed by the owner, or with their approval, before implementation starts.
