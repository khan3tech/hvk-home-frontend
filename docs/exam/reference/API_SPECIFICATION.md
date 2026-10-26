# API Specification

The API is a versioned HTTPS JSON API. Browser authentication uses an HttpOnly, Secure, SameSite cookie session with a 24-hour expiry. The exact existing provider cookie name and verification mechanism remain pending inspection of the existing website.

The machine-readable contract is [`openapi.yaml`](./openapi.yaml), and [`swagger.html`](./swagger.html) provides a Swagger UI shell for interactive documentation. Swagger UI requests include browser credentials so an already-authenticated same-origin session can be used without exposing the HttpOnly cookie to JavaScript.

## Conventions

- Base path: `/api/v1`
- JSON request and response bodies.
- ISO-8601 timestamps in UTC; display times in `Asia/Kolkata`.
- Every mutating retryable operation accepts `Idempotency-Key`.
- Attempt operations require the server-issued `X-Attempt-Session` value returned when the attempt starts.
- Candidate endpoints authorize ownership through the authenticated identity, never a client-supplied candidate ID.

## Candidate endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/exams/candidate-exams` | List managed exams assigned to the authenticated candidate. |
| GET | `/exams/candidate-exams/{examId}` | Read an assigned exam without exposing its invitation token. |
| POST | `/exams/candidate-exams/{examId}/start` | Start or resume an assigned exam from the candidate exam list. |
| GET | `/exams` | List exams visible to the candidate. |
| GET | `/exams/{examId}` | Return availability and public metadata. |
| POST | `/exams/{examId}/attempts` | Create/start the one permitted attempt. |
| GET | `/attempts/{attemptId}` | Return state, deadline, public questions, and save status. |
| PUT | `/attempts/{attemptId}/answers/{questionId}` | Idempotent answer save. |
| POST | `/attempts/{attemptId}/monitoring-events` | Record a client monitoring signal. |
| POST | `/attempts/{attemptId}/submit` | Request manual finalization. |
| GET | `/attempts/{attemptId}/result` | Return result only after publication. |

## Administrator endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/exams` | List exams for an administrator, including editable question answer flags and eligibility IDs. |
| GET | `/admin/exams/{examId}/results` | View administrator-only attempt, score, result status, finalization, and monitoring summaries. |
| POST | `/admin/exams` | Create and validate a draft exam with any number of single-choice questions. |
| PATCH | `/admin/exams/{examId}` | Edit configuration, questions, answer keys, and eligibility before attempts exist. |
| POST | `/admin/exams/{examId}/publish` | Publish a valid draft. |
| POST | `/admin/exams/{examId}/archive` | Archive an exam. |
| POST | `/admin/exams/{examId}/results/publish` | Publish calculated results. |

The backend exposes an authentication adapter boundary. The local development adapter recognizes an administrator through the test-only `x-role: admin` header. In production, the default adapter fails closed; the existing website's verified cookie/session integration must be injected into `createApp({ authenticate })` and return the immutable email identity plus roles. Raw client-supplied identity headers must not be trusted in production.

## Answer save example

```json
{
  "selectedOptionId": "o_a",
  "clientRevision": 4
}
```

Successful response:

```json
{
  "serverRevision": 5,
  "savedAt": "2026-10-13T10:20:00Z",
  "attemptState": "IN_PROGRESS",
  "requestId": "req_123"
}
```

## Error format

```json
{
  "error": {
    "code": "ATTEMPT_EXPIRED",
    "message": "The attempt deadline has passed.",
    "requestId": "req_123"
  },
  "requestId": "req_123"
}
```

Use `401` unauthenticated, `403` unauthorized, `404` hidden/not found, `409` state or uniqueness conflict, `422` validation failure, `429` rate limit, and `500` with no sensitive details.

## Deadline and idempotency

Every answer save and submission request checks the backend clock and attempt state. Submission uses an idempotency key and returns the existing final response for a repeated key or already-final attempt. The frontend timer is informational.

The current executable backend persists idempotency records in its database. Clients should reuse the same `Idempotency-Key` when retrying the same logical operation and generate a new key for a new operation.

Only the browser/device that owns the active attempt session can read, save, monitor, or submit it. A second session receives `409 ACTIVE_SESSION_EXISTS`.
