# Testing Strategy

## Unit tests

- IST date availability and date-end deadline calculation.
- Duration calculations for 30, 45, and 60 minutes.
- Passing marks and percentage calculations.
- Correct/incorrect/unanswered scoring.
- Warning threshold transitions.
- State-transition guards.
- Public question serialization excludes answer keys.

## Integration/API tests

- Authentication identity mapping and role authorization.
- Eligibility and one-attempt uniqueness.
- Exact start-date boundaries in IST.
- Late start receives only remaining date time.
- Answer save retry and idempotency.
- Refresh/reconnect recovery.
- Save after finalization is rejected.
- Manual submit versus expiry race.
- Duplicate submissions create one result.
- Candidate cannot access another candidate’s attempt.
- Admin-only publication.

## End-to-end tests

- Complete exam and publish result.
- Camera permission success, denial, retry, disconnect, and recovery.
- Two monitoring warnings trigger automatic submission.
- Browser refresh preserves server-confirmed answers.
- Network loss and reconnect.
- Multiple tabs/devices are handled according to the single-session policy.
- Candidate sees only final score and qualification after publication.

## Reliability and security tests

- Worker restart and missed expiry recovery.
- Concurrent answer writes.
- Concurrent manual and automatic submission.
- Rate limiting and malformed payloads.
- CORS, cookie/token, CSRF, and authorization checks.
- Backup restoration and audit-log integrity.

