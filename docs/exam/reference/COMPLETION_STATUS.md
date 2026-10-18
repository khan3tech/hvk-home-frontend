# Completion Status

Updated: 2026-10-15

## Completed in the local baseline

- React candidate application and full local administrator panel.
- Exam draft create/edit/save, question and option management, answer-key selection, marks, eligibility, publish, archive, and result publication.
- Node API with IST date availability, configurable duration, authoritative deadline, one attempt, one active session, autosave, idempotency, finalization, objective scoring, and result access control.
- SQLite schema with normalized tables for candidates, administrators, exams, questions, options, exam assignments, eligibility, attempts, attempt questions, answers, results, monitoring events, audit events, and idempotency keys.
- PostgreSQL production driver added with pooled connections, AsyncLocalStorage-isolated transactions, timeout/TLS configuration, `DATABASE_URL` support, ordered migrations, and a local PostgreSQL integration Compose setup; migration/health/public-exam smoke tests were verified against a temporary PostgreSQL instance.
- Backward-compatible JSON snapshots and startup migration for the existing local database.
- Local camera permission gate, confidence-filtered local face-count monitoring, two-warning auto-submit, and no camera upload/retention.
- Request IDs, rate limiting, protected admin routes, production fail-closed authentication adapter, health/readiness endpoints, structured error logging, and graceful shutdown.
- Production configuration now fails closed when the frontend origin or database driver is missing/invalid instead of silently using local defaults.
- Graceful shutdown now waits for the database adapter to release its connections before process exit.
- Backend integration tests: 29/29 passed, including ordered migration tracking, request-ID propagation, idempotent replay behavior, candidate eligibility filtering, cookie-session adapter behavior, configurable verifier-module loading, cookie-authenticated protected routes, and production CSRF origin enforcement.
- Frontend build and test: passed.
- Local SQLite schema, admin API, request ID, and health smoke checks: passed.
- Final audit fixes: localhost/127.0.0.1 CORS handling, no-published-exam empty state, multi-answer offline retry queue, publish-time validation, monitoring-event validation, and admin audit coverage.
- Deployment hardening: Docker backend healthcheck, Compose frontend API build argument, service-health dependency, SQLite and PostgreSQL backup commands, and a PostgreSQL production-like Compose stack.
- PostgreSQL custom-format backup was restored into a separate temporary database and migration metadata verified; staging restore sign-off remains an operational release task.
- PostgreSQL transaction isolation was verified with eight concurrent candidate starts; each request completed successfully without transaction-context errors.
- Frontend container hardening: explicit Nginx SPA fallback, security headers, camera permission policy, and immutable hashed-asset caching configuration added.
- API contract hardening: request IDs are returned in response bodies and error envelopes, with idempotent replay preserving business data; OpenAPI and narrative examples are aligned.
- Swagger readiness: `docs/openapi.yaml` now models the actual cookie-session authentication and `docs/swagger.html` provides an interactive Swagger UI shell with browser credentials enabled.
- Candidate resilience hardening: answer saves now carry durable idempotency keys, retry stale revisions against the current server revision, and reconcile the confirmed server revision after rapid selections or reconnects.
- Monitoring resilience hardening: monitoring-event retries are idempotent and cannot add warnings after an attempt has already been finalized.
- Candidate API hardening: exam metadata endpoints now require an authenticated candidate in production and filter explicitly assigned exams by eligibility.
- Camera resilience hardening: disconnected camera tracks now enter a blocked UI state and emit `CAMERA_LOST` during an active attempt.
- Camera permission hardening: denied/unavailable camera access retries automatically every three seconds until permission is granted or the gate is unmounted.
- Time display hardening: admin defaults and candidate deadline labels use explicit `Asia/Kolkata` formatting instead of the browser/UTC timezone.
- Candidate workflow hardening: candidates can choose among multiple published exams, with selected-exam attempt and published-result restoration preserved.
- Result UX refinement: raw technical statuses such as `NOT_QUALIFIED`, `QUALIFIED`, `AUTO_SUBMITTED`, and `SUBMITTED` are now presented as clear human-readable labels with premium score/result cards, pending-result state, and accessible focus styling.
- Admin answer-key UX fix: each option now has an explicit “Mark correct” control, selected options are visibly highlighted as “Correct answer,” save validates exactly one correct option per question, and persisted answer keys are reflected back after save.
- Authentication decision recorded: 24-hour HttpOnly cookie-session transport with email candidate identity; reusable async cookie adapter added at `backend/src/auth.js`.
- Frontend authentication transport aligned: production builds send browser credentials and do not send development identity headers; Vite development keeps the local-only header adapter for the documented local demo.
- Standalone deployment auth hook added: `AUTH_VERIFY_MODULE` loads the existing website's session verifier without embedding provider-specific credentials or logic; missing production verifier remains fail-closed.
- Migration readiness added: schema changes now run through ordered versioned migrations recorded in `schema_migrations`; `npm run migrate` reports the applied schema version and preserves the existing normalized/compatibility data model.
- Database handoff artifacts added: portable schema snapshot at `docs/DATABASE_SCHEMA.sql` and operational upgrade/restore procedure at `docs/DATABASE_MIGRATION_GUIDE.md`; the snapshot executes successfully against an empty SQLite database.
- Executable SQL migration files added under `backend/migrations/` (`001_initial_schema.sql` and `002_legacy_upgrade.sql`); migration 001 is now loaded directly by the runtime migration runner and its 15-table schema was independently executed and verified.
- Typography refinement: the frontend now uses premium `DM Sans` body text with `Manrope` headings and safe system fallbacks for readable exam content and resilient offline rendering.

## Still required before production sign-off

These items cannot be completed safely without information or systems outside this repository:

1. Existing website authentication contract or repository: provider, session/token format, immutable candidate ID, administrator role source, logout/expiry behavior, and allowed frontend/backend origins.
2. Production hosting details: domain names, HTTPS termination, database choice/backup location, secret manager, and deployment target.
3. Browser acceptance matrix and a real browser/camera test environment for permission denial, camera loss, face-detection false positives, accessibility, and refresh/reconnect behavior.
4. Operational and policy decisions: retention/deletion schedule, privacy/legal review, candidate grievance process, support contacts, incident response, and backup-restore sign-off.
5. Staging environment for load, security, deployment, and end-to-end acceptance testing.

The application is ready for local use now. Production authentication and deployment must remain disabled until the first two items are supplied and verified.
