# Security and Reliability

## Threat model

Assume candidates can inspect frontend code, modify requests, replay requests, alter local timers, open multiple tabs, disconnect, and submit malformed data. Assume monitoring signals can be absent or false. No client-side control is a security boundary.

## Controls

- Integrate with the existing authentication system through the backend authentication adapter; never duplicate credentials unnecessarily. The default production adapter fails closed until a verified provider is injected.
- Enforce candidate/admin authorization server-side on every endpoint.
- Validate exam eligibility, dates, ownership, question IDs, option IDs, and state transitions.
- Keep answer keys and privileged credentials backend-only.
- Use secure transport and an HttpOnly, Secure, SameSite cookie session with a 24-hour maximum lifetime. Add CSRF protection for cookie-authenticated state-changing requests using an origin check and/or a server-issued CSRF token; keep strict CORS.
- The executable backend rejects production state-changing API requests without an allowed `Origin` matching `FRONTEND_ORIGIN` with `CSRF_ORIGIN_REJECTED`; deployment must configure the real frontend origin.
- The production server refuses to start without an explicit `FRONTEND_ORIGIN` and rejects unknown `DATABASE_DRIVER` values; localhost CORS defaults are development-only.
- Rate-limit login-adjacent and answer/monitoring endpoints.
- Persist idempotency keys for retryable answer saves and submissions; replay the original response for a repeated key.
- Keep the development identity-header adapter disabled in production; production requests require the existing authentication integration.
- Send baseline response protections such as `X-Content-Type-Options: nosniff` and a restrictive referrer policy.
- Use parameterized queries or ORM safeguards and output encoding.
- Redact tokens, answer keys, camera details, and personal data from logs.
- Audit admin configuration, publication, overrides, submissions, and result changes.

## Deadline reliability

Persist `deadline_at` and check it on every write. Run a backend expiry sweep over `IN_PROGRESS` attempts whose deadline has passed. Make the sweep safe to repeat. On restart, the next sweep recovers missed expirations. If the hosting platform cannot provide a reliable process, use its supported scheduled job or a durable queue; do not depend on browser callbacks.

## Race handling

Manual submit is the only scoring/finalization transition. A timeout worker moves an unsubmitted attempt to `EXPIRED` without creating a result, while monitoring warnings only increment their audit count. Lock the attempt or use optimistic versioning so repeated manual submits remain idempotent.

## Operations

Monitor API errors, failed saves, expiry backlog, worker health, database health, and unusual authorization failures. Graceful shutdown waits for the database-close promise so pooled PostgreSQL connections are released before process exit. Test backups and restoration. Define incident response, audit access, and candidate support procedures before launch.
