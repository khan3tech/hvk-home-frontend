# Feature Specification: Candidate Platform API (Backend)

**Feature Branch**: `001-candidate-platform-api`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Candidate Platform backend per Candidate-Platform-HLD.docx and
Candidate-Platform-LLD.docx: registration & authentication (email/password + mobile OTP),
onboarding demo video (complete or skip), Razorpay registration fee, exam link hand-off after
verified payment, Talent Acquisition (TA) lead at registration and 24-hour unpaid follow-up,
feedback after exam, thank-you, and result email 24 hours after exam completion. Backend only."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register and sign in (Priority: P1)

A candidate creates an account with full name, email, mobile number, city, state, PIN code and
password, accepting the terms. They can later sign in with email-or-phone + password, or with a one-time code sent to
their mobile. Registration immediately creates a Talent Acquisition lead so the TA team knows a
new candidate exists.

**Why this priority**: Nothing else in the journey is possible without an identity; the TA lead
is the earliest business value (a captured prospect).

**Independent Test**: Register via the API, sign in both ways, read own profile, sign out; verify
a TA lead record exists for the candidate.

**Acceptance Scenarios**:

1. **Given** no account exists, **When** a candidate registers with valid details and accepts
   terms, **Then** the account is created, the next step is `demo_pending`, and exactly one TA
   lead is recorded.
2. **Given** a registration missing city, state or PIN code, or with a PIN code that is not a
   valid 6-digit Indian PIN, **Then** it is rejected with field-level validation errors.
3. **Given** an account exists for an email or phone, **When** someone registers with the same
   email or phone, **Then** registration is rejected as a conflict without creating a lead.
4. **Given** a registered candidate, **When** they sign in with wrong credentials, **Then** they
   receive a generic "invalid credentials" response that does not reveal which part was wrong.
5. **Given** a registered phone, **When** the candidate requests an OTP and submits it before it
   expires, **Then** they are signed in and the code cannot be reused.
6. **Given** an OTP request for an unregistered phone, **Then** the response is identical to a
   registered phone's response (no account enumeration).
7. **Given** a signed-in candidate, **When** they sign out, **Then** their refresh credential no
   longer works.
8. **Given** a candidate forgot their password, **When** they request a reset and use the
   single-use link before expiry, **Then** the password changes and existing sessions are revoked.

---

### User Story 2 - Onboarding demo video (Priority: P2)

After registering, the candidate sees a demo video. They can mark it complete or skip it; both
move them to the fee step. Their progress is stored on the server so they resume at the right
step after signing in on any device.

**Why this priority**: Required step between registration and payment; small and low risk.

**Independent Test**: Register, read onboarding status (`demo_pending`), call skip or complete,
read status again (`fee_pending`); repeat the call and confirm it is idempotent.

**Acceptance Scenarios**:

1. **Given** a candidate at `demo_pending`, **When** they complete or skip the demo, **Then**
   their step becomes `fee_pending` and the action (completed vs skipped) is recorded.
2. **Given** a candidate already past the demo, **When** skip/complete is called again, **Then**
   the response succeeds without changing their step (idempotent).

---

### User Story 3 - Pay registration fee and receive exam link (Priority: P1)

At `fee_pending` the candidate starts a payment. The server creates a Razorpay order for the
configured fee. After checkout, the server verifies the payment; only then does the candidate
become exam-ready, receive the exam link by email, and get the link back for redirect.

**Why this priority**: Revenue and the gate to the exam; highest correctness/security risk.

**Independent Test**: With a mocked Razorpay, create an order, submit a correctly signed
checkout response, confirm status `paid`, candidate `exam_ready`, an exam-link email notification
recorded, and `GET /exams/current` returns the link. Submit a bad signature and confirm rejection.

**Acceptance Scenarios**:

1. **Given** a candidate at `fee_pending`, **When** they create an order, **Then** the amount and
   currency come from server configuration and a pending payment is stored.
2. **Given** a pending order, **When** a checkout response with a valid signature is submitted,
   **Then** the payment becomes `paid`, the candidate becomes `exam_ready`, an exam attempt with a
   link is issued, and one exam-link email is queued.
3. **Given** a checkout response with an invalid signature, **Then** it is rejected and the
   payment stays unpaid.
4. **Given** a paid payment, **When** the same verification or webhook arrives again, or a late
   `failed` webhook arrives, **Then** nothing changes and no duplicate email or attempt is created.
5. **Given** a webhook with an invalid signature, **Then** it is rejected and not processed.
6. **Given** a candidate who has not paid, **When** they ask for the exam link, **Then** they are
   refused with a workflow-state error.

---

### User Story 4 - TA follow-up for unpaid candidates (Priority: P2)

If a candidate has not paid 24 hours after registering, the system creates a payment follow-up
for the TA team. TA/admin staff can list, view and update leads and follow-ups.

**Why this priority**: Recovers revenue from drop-offs; depends on Stories 1 and 3.

**Independent Test**: Register, advance time past 24 hours (or run the job directly), confirm one
follow-up exists; pay before the deadline and confirm none is created. As an admin, list and
update leads; as a candidate, confirm admin routes are forbidden.

**Acceptance Scenarios**:

1. **Given** a candidate unpaid at the 24-hour deadline, **When** the follow-up job runs, **Then**
   exactly one payment follow-up is created (re-running does not duplicate it).
2. **Given** a candidate who paid before the deadline, **When** the job runs, **Then** no
   follow-up is created.
3. **Given** a TA user, **When** they update a lead's status, **Then** only allowed transitions
   succeed and the actor and time are recorded in an audit trail.
4. **Given** a candidate token, **When** calling any admin route, **Then** access is forbidden.

---

### User Story 5 - Exam completion, feedback and thank-you (Priority: P2)

When the exam provider reports that the candidate completed the exam, the attempt is marked
complete. The candidate then submits feedback (rating, answers, comments) once, and the client
shows a thank-you page.

**Why this priority**: Closes the candidate journey; depends on a trusted completion signal.

**Independent Test**: Send a correctly signed provider callback for an attempt, confirm
`exam_completed`; submit feedback, confirm `feedback_submitted`; submit again and get a conflict.

**Acceptance Scenarios**:

1. **Given** an issued attempt, **When** a signed provider callback reports completion, **Then**
   the attempt becomes `completed` and a result email is scheduled 24 hours later.
2. **Given** a callback with a bad signature or a replayed event, **Then** it is rejected/ignored.
3. **Given** a completed attempt, **When** feedback is submitted, **Then** it is stored once;
   a second submission returns a conflict.
4. **Given** an attempt not yet completed, **When** feedback is submitted, **Then** it is
   refused with a workflow-state error.

---

### User Story 6 - Result email 24 hours after completion (Priority: P3)

Twenty-four hours after exam completion the candidate is emailed their result — but only if the
result has been finalized. If it is not final yet, the email is retried later with bounded
backoff. The candidate can also read their published result via the API.

**Why this priority**: Final communication step; depends on Story 5.

**Independent Test**: Complete an attempt, finalize a result (via provider callback), run the
result-email job, confirm exactly one email and status `emailed`; run again and confirm no
duplicate; with a non-final result, confirm the job reschedules instead of sending.

**Acceptance Scenarios**:

1. **Given** a finalized result at the deadline, **When** the job runs, **Then** one result email
   is sent and the result is marked emailed.
2. **Given** a result not finalized at the deadline, **When** the job runs, **Then** no email is
   sent and the job is rescheduled until a maximum number of attempts, then flagged for operators.
3. **Given** a candidate, **When** they read their result, **Then** only their own published
   fields are returned.

---

### User Story 7 - Operable, containerised service (Priority: P1, foundational)

Developers run the API, worker, MongoDB and Redis locally with Docker Desktop on Windows.
Operators can probe liveness and readiness; every request carries a correlation ID.

**Why this priority**: Foundation for every other story.

**Independent Test**: `docker compose up`, then `GET /health/live` → 200 and `GET /health/ready`
→ 200 with DB up, 503 with DB down; responses include `X-Request-Id`.

**Acceptance Scenarios**:

1. **Given** the stack is running, **When** liveness is probed, **Then** it returns 200.
2. **Given** MongoDB is unreachable, **When** readiness is probed, **Then** it returns 503.

### Edge Cases

- Email differing only by case/whitespace, or phone in different formats, is treated as duplicate.
- OTP: wrong code (attempt counter, lockout after max attempts), expired code, resend within
  cooldown, consumed code reused.
- Payment: candidate creates multiple orders (reuse an open pending order); checkout cancelled;
  webhook arrives before verify call; webhook for an unknown order; duplicate webhook event ID.
- Candidate tries to pay when already paid → workflow-state error.
- Exam provider callback for unknown attempt; completion before link issue.
- Result email job runs after the candidate's result was already emailed (no duplicate).
- Email/OTP provider transient failure → retried with backoff; terminal failure recorded.
- Process restart between scheduling and execution of any 24-hour job → job still runs once.

## Requirements *(mandatory)*

### Functional Requirements

**Identity & access**
- **FR-001**: System MUST register candidates with full name, email, mobile (E.164), city, state,
  PIN code and password, requiring terms acceptance; email and phone MUST be normalized and unique.
  City, state and PIN code are mandatory; PIN code MUST be a 6-digit Indian PIN (first digit 1–9).
- **FR-002**: System MUST store passwords only as strong one-way hashes; plaintext never stored.
- **FR-003**: System MUST authenticate via email-or-phone + password and via mobile OTP.
- **FR-004**: OTPs MUST be stored hashed, expire (default 5 min), allow limited attempts
  (default 5), be single-use, and enforce a resend cooldown (default 60 s).
- **FR-005**: System MUST issue short-lived access credentials and rotating, revocable refresh
  credentials; sign-out revokes the refresh credential.
- **FR-006**: System MUST support forgot/reset password with a single-use expiring token,
  revoking sessions on reset; the forgot endpoint responds identically for unknown emails.
- **FR-007**: Login, registration, OTP, password-reset and payment endpoints MUST be rate-limited.
- **FR-008**: Candidates MUST be able to read and update only allowlisted fields of their own
  profile (full name, city, state, PIN code); roles, status, payment and results are never client-writable.
- **FR-009**: TA/admin routes MUST require a TA or admin role; changes MUST be audit-logged.

**Onboarding**
- **FR-010**: System MUST track onboarding state server-side through: registered → demo_pending →
  fee_pending → exam_ready → exam_in_progress → exam_completed → feedback_submitted → completed,
  rejecting disallowed transitions.
- **FR-011**: Demo complete and demo skip MUST both advance to fee_pending, idempotently, and
  record which action occurred.

**Payment & exam access**
- **FR-012**: System MUST create payment orders with amount/currency from server configuration,
  persisting a pending payment; an existing open order for the candidate is reused.
- **FR-013**: System MUST verify checkout signatures server-side and verify webhooks against the
  raw body; only verified states may set `paid`; `paid` MUST never regress.
- **FR-014**: Webhook events MUST be de-duplicated by provider event ID.
- **FR-015**: On first verified payment, system MUST (exactly once) mark the candidate
  exam_ready, issue an exam attempt and link via the exam adapter, and queue an exam-link email.
- **FR-016**: Exam link MUST only be returned to a candidate with a verified paid payment.

**Talent Acquisition**
- **FR-017**: Registration MUST create exactly one TA lead and queue one TA notification.
- **FR-018**: System MUST schedule an unpaid check 24 hours after registration (timer origin
  configurable); if still unpaid it creates/updates exactly one payment follow-up; if paid, no-op.
- **FR-019**: TA users MUST be able to list (paginated, filterable), view and update leads, and
  list pending payment follow-ups, seeing only minimum necessary candidate fields.

**Exam, feedback, results**
- **FR-020**: Exam completion and result data MUST come only from an authenticated provider
  callback (HMAC signature + timestamp window + event-ID replay protection).
- **FR-021**: On completion, system MUST schedule a result email for 24 hours later.
- **FR-022**: Candidates MUST be able to submit feedback (rating 1–5, answers, comments) once per
  completed attempt.
- **FR-023**: Result email job MUST send only when the result is finalized and not yet emailed;
  otherwise reschedule with bounded backoff and record terminal failure.
- **FR-024**: Candidates MUST be able to read their own published result.

**Notifications & reliability**
- **FR-025**: All notifications MUST be persisted with a unique idempotency key, status,
  attempts, and last error code; transient failures retry with exponential backoff.
- **FR-026**: Scheduled jobs MUST survive API/worker restarts and execute at most once per
  business key.

**API & operations**
- **FR-027**: All endpoints MUST be under `/api/v1` and use the standard success/error envelope
  with request ID; errors never expose stack traces, secrets or internals.
- **FR-028**: System MUST expose liveness and readiness (DB-aware) health endpoints.
- **FR-029**: Logs MUST be structured, carry request IDs, and redact sensitive fields.
- **FR-030**: System MUST publish an interactive API reference (Swagger UI) and a machine-readable
  OpenAPI 3.1 document generated from the same validation schemas the API enforces; it is enabled
  by default outside production and can be toggled by configuration.

### Key Entities

- **Candidate**: person registering; name, normalized email, E.164 phone, city, state, PIN code,
  password hash, role
  (candidate / ta / admin), onboarding step, demo action.
- **Session (refresh token)**: candidate's revocable login; token hash, expiry, revocation.
- **OTP challenge**: one-time code for a phone; code hash, purpose, expiry, attempts, consumed.
- **Password reset token**: single-use, hashed, expiring.
- **Payment**: Razorpay order/payment for a candidate; amount (minor units), currency, status.
- **Webhook event**: provider event ID for de-duplication.
- **Exam attempt**: candidate's exam session; external ID, URL, status, timestamps.
- **Feedback**: one per completed attempt; rating, answers, comments.
- **Result**: per attempt; score, outcome, status, finalized/emailed timestamps.
- **Notification**: an outbound message; type, channel, status, idempotency key, attempts.
- **TA lead**: one per candidate; status, assignee, next action, notes.
- **TA follow-up**: one per candidate per type (unpaid payment); due date, status, outcome.
- **Audit log**: actor, action, entity, before/after summary, timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A candidate can go from registration to holding an exam link in under 5 minutes
  of their own time (excluding payment provider time).
- **SC-002**: 100% of exam-access grants correspond to a server-verified payment (0 grants from
  unverified client responses in tests and audits).
- **SC-003**: Replaying any webhook, callback, or job execution 10 times produces exactly the same
  end state as running it once (no duplicate emails, leads, follow-ups, or attempts).
- **SC-004**: Restarting the API and worker between scheduling and the 24-hour deadline still
  produces exactly one follow-up / result email.
- **SC-005**: Every TA lead is recorded within 5 seconds of registration.
- **SC-006**: Auth endpoints return indistinguishable responses for registered vs unregistered
  identifiers.
- **SC-007**: Every documented failure path in the Edge Cases section has an automated test.

## Assumptions

- **Exam provider (TBD)**: treated as external. A default "configured link" adapter builds the
  URL from a template (`EXAM_URL_TEMPLATE`) with the attempt ID; completion/results arrive via an
  HMAC-signed callback. Real provider plugs in behind the same adapter.
- **Email / SMS providers (TBD)**: adapters with a console (log-only, no secrets) implementation
  for development; real providers configured later.
- **TA channel (TBD)**: leads and follow-ups are always persisted internally and exposed via
  admin APIs; outbound TA notification uses the email adapter to `TA_NOTIFY_EMAIL`.
- **Fee**: `REGISTRATION_FEE_MINOR` + `REGISTRATION_FEE_CURRENCY` from config (default INR).
- **24-hour unpaid timer origin**: candidate registration time (configurable delay).
- **Result-not-final policy**: retry every `RESULT_RETRY_DELAY` (default 6 h) up to
  `RESULT_MAX_ATTEMPTS` (default 28 ≈ 7 days), then mark `failed` for operator attention.
- **Both email and phone are mandatory** at registration.
- **Credentials**: JWT access token (15 min) + opaque refresh token (30 days, rotated) returned in
  the JSON body so web and mobile share the same contract; cookie strategy is a frontend decision.
- **Refunds/cancellations**: out of scope for v1 (status `refunded` modelled, not automated).
- Frontend (web/mobile) is out of scope for this repository.
