# Detailed Project Completion Checklist

Current local/production status is summarized in [`COMPLETION_STATUS.md`](./COMPLETION_STATUS.md). Items requiring an existing-site contract, staging infrastructure, or formal review remain intentionally unchecked.

Use this checklist as the execution tracker for the complete project. Check an item only when its evidence exists in the repository, test report, deployment environment, or approved decision record.

## Checklist conventions

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- Every completed implementation item should have a linked test, review, or artifact.
- No production deployment should proceed while a release-blocking item remains incomplete.

## 0. Project control and ownership

- [ ] Assign product owner.
- [ ] Assign frontend owner.
- [ ] Assign backend owner.
- [ ] Assign database/reliability owner.
- [ ] Assign security/privacy reviewer.
- [ ] Assign deployment/operations owner.
- [ ] Define issue tracker, branching strategy, pull-request rules, and review requirements.
- [ ] Define development, staging, and production environments.
- [ ] Define incident escalation and candidate-support contacts.
- [ ] Define how requirement changes are approved and recorded.

## 1. Requirements approval

- [x] Confirm exam uses an administrator-selected fixed calendar date.
- [x] Confirm all exam business time uses `Asia/Kolkata`.
- [x] Confirm candidate may start at any time on the configured date.
- [x] Confirm effective deadline is the earlier of duration expiry and the end of the exam date.
- [x] Confirm duration is configurable per exam.
- [x] Confirm no late-entry exceptions.
- [x] Confirm no pause, resume, restart, or retake.
- [x] Confirm one attempt per candidate per exam.
- [x] Confirm one active browser/device session per attempt.
- [x] Confirm release-one questions are single-choice.
- [x] Confirm questions and options are shuffled.
- [x] Confirm no question images in release one.
- [x] Confirm no negative marking.
- [x] Confirm exact correct option receives full marks.
- [x] Confirm result publication is administrator-controlled.
- [x] Confirm candidate sees only final score and qualification status.
- [x] Confirm camera permission is mandatory.
- [x] Confirm two total monitoring warnings trigger automatic submission.
- [x] Confirm no camera images or video are retained in release one.
- [ ] Confirm exact passing-mark/passing-percentage UI and validation rules.
- [ ] Confirm candidate eligibility source: all users, groups, or explicit candidate list.
- [ ] Confirm supported desktop/mobile browsers and minimum versions.
- [ ] Confirm accessibility and camera-exception support process.
- [ ] Record all changes in `DECISIONS_AND_ASSUMPTIONS.md`.

## 2. Existing-system and authentication integration

- [ ] Obtain the existing website repository or integration documentation.
- [ ] Identify the existing frontend framework and build process.
- [ ] Identify the existing backend framework and runtime version.
- [ ] Identify the authentication provider and flow.
- [ ] Identify candidate user ID and immutable identity field.
- [ ] Identify administrator role/permission source.
- [ ] Identify session cookie or token format and expiration behavior.
- [ ] Confirm whether frontend and backend share a parent domain.
- [ ] Confirm CORS origins and credentials requirements.
- [ ] Confirm logout and session-expiry behavior.
- [ ] Confirm user-profile endpoint or identity claims available to the exam backend.
- [ ] Confirm database ownership and whether the exam backend may access existing user data.
- [ ] Define a local candidate/admin identity adapter.
- [ ] Test unauthenticated, candidate, administrator, and expired-session requests.
- [ ] Document the signed-off integration contract.

## 3. Architecture and repository setup

- [x] Create separate `frontend/` and `backend/` application directories.
- [x] Select and record supported Node.js version.
- [x] Select and record React build tooling.
- [x] Select database engine based on hosting and integration constraints.
- [ ] Select ORM/query layer and record rationale.
- [x] Define module boundaries for exams, questions, attempts, answers, evaluation, results, monitoring, auth, and audit.
- [x] Define frontend API client boundary.
- [x] Define environment variable names and ownership.
- [x] Create safe example environment files without secrets.
- [x] Define local development commands for both applications.
- [ ] Define staging and production deployment topology.
- [ ] Confirm frontend never receives database credentials, answer keys, or signing secrets.
- [ ] Confirm backend is the only database and scheduler client.
- [x] Update architecture documentation after technology selections.

## 4. Database and migrations

- [ ] Create database connection configuration for each environment.
- [ ] Implement candidate identity reference.
- [ ] Implement administrator/role reference.
- [ ] Implement exams and exam status fields.
- [ ] Implement exam eligibility rules.
- [ ] Implement questions and question types.
- [ ] Implement question options and private correct-answer field.
- [ ] Implement exam-question assignment and marks.
- [ ] Implement attempts and lifecycle state.
- [ ] Implement frozen attempt question/option order.
- [ ] Implement answers and save revisions.
- [ ] Implement results and publication state.
- [ ] Implement monitoring events and warning count.
- [ ] Implement audit events.
- [ ] Add unique constraint for one attempt per candidate/exam.
- [ ] Add unique constraint for one result per attempt.
- [ ] Add answer and attempt indexes required by expiry recovery.
- [ ] Add foreign keys and deletion/update behavior.
- [x] Add migration rollback or recovery procedure.
- [x] Add seed data for local development only.
- [x] Test migration from an empty database.
- [ ] Test backup and restore of a staging database.
- [ ] Confirm answer keys are never included in public query projections.

## 5. Backend foundation

- [ ] Implement application configuration validation at startup.
- [ ] Implement structured logging with request IDs.
- [ ] Implement centralized error handling.
- [ ] Implement request body/schema validation.
- [ ] Implement authentication middleware/adapter.
- [ ] Implement candidate authorization.
- [ ] Implement administrator authorization.
- [ ] Implement rate limiting.
- [ ] Implement secure CORS policy.
- [ ] Implement secure cookie/token settings as required by the auth design.
- [ ] Implement health and readiness endpoints.
- [ ] Implement graceful shutdown.
- [x] Implement database connection pooling and timeout handling.
- [ ] Redact tokens, passwords, answer keys, and sensitive monitoring data from logs.
- [ ] Add backend unit and integration test harness.

## 6. Administrator exam management

- [ ] Implement exam create endpoint and form.
- [ ] Validate title, date, duration, and instructions.
- [ ] Implement passing marks or percentage configuration.
- [ ] Validate that only one qualification rule is active.
- [ ] Implement eligibility configuration.
- [ ] Implement monitoring policy configuration.
- [ ] Implement result publication policy.
- [ ] Implement draft and published states.
- [ ] Prevent invalid exam publication.
- [ ] Prevent unsafe edits to an exam with attempts, or define versioning behavior.
- [ ] Implement exam list, detail, edit, publish, and archive views.
- [ ] Record all admin changes in audit events.

## 7. Question management

- [ ] Implement single-choice question creation.
- [ ] Require at least two options.
- [ ] Require exactly one correct option.
- [ ] Validate non-empty question and option text.
- [ ] Implement question update and deletion rules.
- [ ] Implement exam-question assignment.
- [ ] Implement question marks.
- [ ] Implement question ordering configuration.
- [ ] Implement option ordering configuration.
- [ ] Implement shuffle settings.
- [ ] Prevent answer keys from admin-to-candidate API projections.
- [ ] Test published-exam question immutability/versioning.

## 8. Candidate availability and attempt creation

- [ ] Implement candidate exam listing.
- [ ] Implement date availability in `Asia/Kolkata`.
- [ ] Implement eligibility validation.
- [ ] Implement one-attempt uniqueness.
- [ ] Implement camera readiness/pre-exam prerequisite.
- [ ] Calculate and persist server-authoritative `started_at` and `deadline_at`.
- [ ] Persist a stable question order for each attempt.
- [ ] Persist a stable option order for each attempt.
- [ ] Create a single active session identifier.
- [ ] Reject a second active browser/device session according to policy.
- [ ] Return only public question data.
- [ ] Test before-date, valid-date, after-date, duplicate-attempt, and late-start cases.

## 9. Answer autosave and recovery

- [ ] Implement answer payload validation.
- [ ] Verify question belongs to the attempt.
- [ ] Verify option belongs to the question.
- [ ] Verify attempt is still mutable.
- [ ] Verify server deadline on every save.
- [ ] Implement idempotency key handling.
- [ ] Implement optimistic version or transaction locking strategy.
- [ ] Return server-confirmed save timestamp/revision.
- [ ] Implement frontend debounced save.
- [ ] Implement periodic background save.
- [ ] Implement local temporary state for connection loss.
- [ ] Implement safe retry after reconnect.
- [ ] Reconcile local state with server state after refresh.
- [ ] Reject stale writes after finalization.
- [ ] Test duplicate, out-of-order, concurrent, late, and malformed saves.

## 10. Submission, expiry, and scoring

- [ ] Implement manual-submit confirmation UI.
- [ ] Implement transactional manual finalization.
- [ ] Implement expiry recovery worker/sweep.
- [ ] Ensure expiry recovery works after backend restart.
- [ ] Check deadline in the worker and every protected write.
- [ ] Implement warning-threshold automatic submission.
- [ ] Implement one-way final attempt state transition.
- [ ] Freeze answer changes after finalization.
- [ ] Implement objective scoring in the backend.
- [ ] Implement passing marks/percentage calculation.
- [ ] Create exactly one result per attempt.
- [ ] Make manual submit, timeout, warning submit, and retries idempotent.
- [ ] Test simultaneous save/submit/timeout requests.
- [ ] Test browser closure, refresh, offline mode, and reconnect.
- [ ] Test worker retry and missed-expiry recovery.

## 11. Monitoring and camera flow

- [ ] Create privacy notice and pre-exam monitoring instructions.
- [ ] Implement HTTPS camera permission flow.
- [ ] Implement camera-ready, denied, unavailable, disconnected, and retry states.
- [ ] Implement local face-count detection.
- [ ] Define sampling interval and confidence thresholds.
- [ ] Avoid uploading camera frames or video.
- [ ] Implement no-face and multiple-face event policy.
- [ ] Implement monitoring event API validation and rate limits.
- [ ] Ensure backend calculates/validates warning threshold.
- [ ] Show warning count clearly and accessibly.
- [ ] Auto-submit after two total qualifying warnings.
- [ ] Store only minimum event metadata.
- [ ] Test false positives, camera recovery, denied permission, and repeated events.
- [ ] Document browser/model limitations and support process.

## 12. React candidate application

- [ ] Implement authenticated route protection.
- [ ] Implement exam list and availability states.
- [ ] Implement pre-exam instructions and consent.
- [ ] Implement camera readiness screen.
- [ ] Implement exam workspace and question navigation.
- [ ] Implement shuffled question and option rendering.
- [ ] Implement one selection per single-choice question.
- [ ] Implement server-synchronized timer display.
- [ ] Implement save status: saving, saved, offline, reconnecting, failed.
- [ ] Implement monitoring warning display.
- [ ] Implement manual submission confirmation.
- [ ] Implement submission-in-progress and submitted states.
- [ ] Implement expired/auto-submitted state.
- [x] Implement result pending and published result screens.
- [ ] Prevent answer keys and trusted scoring logic from the bundle.
- [ ] Implement keyboard accessibility and responsive layout.
- [ ] Test refresh and route restoration.

## 13. Frontend/backend integration

- [ ] Create typed or schema-validated API client boundary.
- [ ] Implement consistent request IDs and error display.
- [ ] Implement authentication credentials handling.
- [ ] Implement `401` session-expired behavior.
- [ ] Implement `403`, `404`, `409`, `422`, `429`, and `5xx` handling.
- [ ] Verify CORS in local, staging, and production environments.
- [ ] Verify HTTPS and secure cookie behavior where applicable.
- [ ] Verify frontend cannot call database or worker services directly.
- [ ] Verify candidate ownership on every attempt endpoint.
- [ ] Verify admin role on every admin endpoint.
- [ ] Run contract tests against documented API examples.

## 14. Testing completion

- [ ] Unit tests pass for date, deadline, scoring, validation, and transitions.
- [ ] API tests pass for authentication and authorization.
- [ ] API tests pass for exam and question management.
- [ ] API tests pass for attempt uniqueness and session rules.
- [ ] API tests pass for answer autosave and idempotency.
- [ ] API tests pass for finalization races.
- [ ] API tests pass for result publication.
- [ ] End-to-end candidate journey passes.
- [ ] End-to-end admin journey passes.
- [ ] Browser refresh/reconnect tests pass.
- [ ] Browser compatibility tests pass for approved browsers.
- [ ] Accessibility tests pass.
- [ ] Security tests pass for authorization, injection, CSRF, CORS, rate limits, and data exposure.
- [ ] Load tests cover concurrent starts, answer saves, submissions, and expiry sweep.
- [ ] Backup restoration test passes.
- [ ] All critical defects are closed or explicitly accepted.

## 15. Security, privacy, and operational readiness

- [ ] Complete threat model review.
- [ ] Complete dependency vulnerability review.
- [ ] Complete secret and environment configuration review.
- [ ] Complete answer-key exposure review.
- [ ] Complete access-control review.
- [ ] Complete audit-log review.
- [ ] Complete camera/privacy notice review.
- [ ] Define retention and deletion schedules.
- [ ] Define candidate grievance and monitoring appeal process.
- [ ] Obtain legal/privacy review for applicable Indian requirements.
- [ ] Configure error monitoring and alerting.
- [ ] Configure expiry-worker health alerting.
- [ ] Configure database backup schedule.
- [ ] Test restore and disaster recovery procedure.
- [ ] Create incident response runbook.
- [ ] Create candidate support runbook.

## 16. Deployment

- [x] Build frontend successfully in a clean environment.
- [x] Build backend successfully in a clean environment.
- [ ] Run database migrations in staging.
- [ ] Configure staging secrets through the approved secret manager.
- [ ] Deploy backend to staging.
- [ ] Deploy frontend to staging.
- [ ] Verify domain, TLS, CORS, cookies/tokens, and camera permissions.
- [ ] Run full staging smoke test.
- [ ] Verify scheduler/expiry worker is running and observable.
- [ ] Verify logs and alerts do not expose sensitive data.
- [ ] Obtain staging acceptance sign-off.
- [ ] Prepare production rollback procedure.
- [ ] Deploy production during an approved window.
- [ ] Run production smoke test with a controlled exam.
- [ ] Confirm support and monitoring coverage.

## 17. Final acceptance

- [ ] Administrator can create and publish a valid exam.
- [ ] Administrator cannot publish an invalid exam.
- [ ] Eligible candidate can start on the configured IST date.
- [ ] Candidate cannot start before or after the date.
- [ ] Late start receives only the remaining date time.
- [ ] Candidate can complete and manually submit an attempt.
- [ ] Answers survive refresh and reconnection after successful save.
- [ ] Browser closure does not prevent server finalization.
- [ ] Expired attempts are finalized without frontend participation.
- [ ] Two monitoring warnings automatically submit the attempt.
- [ ] Duplicate submissions create no duplicate result.
- [ ] Candidate cannot see answer keys or another candidate’s data.
- [ ] Candidate sees result only after administrator publication.
- [ ] Score and qualification status are correct for all marking cases.
- [ ] Audit events exist for required administrative and finalization actions.
- [ ] Backup restoration and incident procedures are proven.
- [ ] Product owner signs final acceptance.
- [ ] Security/privacy reviewer signs final acceptance.
- [ ] Operations owner signs production readiness.

## Recommended first execution sequence

1. Complete Section 2: existing authentication and integration discovery.
2. Complete technology selections in Section 3.
3. Approve the database design in Section 4.
4. Implement backend foundation and protected health endpoint.
5. Implement exam/question management before candidate attempts.
6. Implement attempt deadlines, autosave, and finalization before visual polish.
7. Integrate the React candidate flow.
8. Add monitoring, then complete security, privacy, and release testing.
