# HVK Exam Implementation Plan

## 1. Objective

Integrate the online examination system into:

- `hvk-home-backend`
- `hvk-home-frontend`

The implementation must use the existing HVK authentication, candidate records, MongoDB models, notification outbox, Redis/BullMQ worker, admin authorization, and frontend session provider.

Do not create a separate user or authentication system for examinations.

## 2. Required candidate flow

```text
Admin creates draft exam
        ↓
Admin publishes exam
        ↓
Eligible registered candidates are selected
        ↓
One unique invitation is created per candidate
        ↓
Email notification is queued
        ↓
Candidate opens the invitation link
        ↓
HVK login/session is verified
        ↓
Candidate starts one active attempt
        ↓
Questions are answered and autosaved
        ↓
Candidate manually submits the exam
        ↓
Admin publishes the result
```

## 3. Existing HVK components to reuse

### Backend

Reuse these existing modules:

- `src/middleware/auth.middleware.ts`
- `authOf(req).sub` for the authenticated candidate ID
- `CandidateModel.emailNormalized`
- `NotificationService.enqueue()`
- `NotificationModel`
- Existing email provider abstraction
- Existing Redis/BullMQ scheduler and worker
- Existing admin role middleware
- Existing request ID, validation, rate limiting and error middleware

### Frontend

Reuse these existing components:

- Existing session provider and authenticated API client
- Existing portal/admin layouts
- Existing `/exam` route structure
- Existing API error handling
- Existing premium dialog and notification patterns

## 4. Data model

### 4.1 Exam model

Create an `Exam` model with at least:

```ts
{
  title: string;
  description?: string;
  scheduledDate: Date;       // authoritative date, interpreted in Asia/Kolkata
  durationMinutes: number;
  status: 'draft' | 'published' | 'archived';
  questions: Question[];
  eligibility: {
    mode: 'all_registered' | 'candidate_ids';
    candidateIds?: ObjectId[];
  };
  resultPublished: boolean;
  createdBy: ObjectId;
  publishedAt?: Date;
  archivedAt?: Date;
}
```

A question must contain:

```ts
{
  id: string;
  prompt: string;
  marks: number;
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
  }[];
}
```

Do not expose `isCorrect` in candidate APIs.

### 4.2 Exam invitation model

Create `ExamInvite`:

```ts
{
  examId: ObjectId;
  candidateId: ObjectId;
  emailSnapshot: string;
  tokenHash: string;
  status: 'invited' | 'started' | 'submitted' | 'expired' | 'revoked';
  attemptId?: ObjectId;
  expiresAt?: Date;
  startedAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
}
```

Indexes:

```text
unique(examId, candidateId)
unique(tokenHash)
index(status, expiresAt)
```

Generate a cryptographically secure random raw token for the email URL. Store only a SHA-256 hash of the token in MongoDB.

### 4.3 Exam attempt model

The current attempt model is candidate-only and must become exam-specific.

Required fields:

```ts
{
  examId: ObjectId;
  candidateId: ObjectId;
  inviteId: ObjectId;
  status: 'in_progress' | 'submitted' | 'expired';
  startedAt: Date;
  deadlineAt: Date;
  completedAt?: Date;
  finalizationReason?: 'manual' | 'deadline';
  answers: Record<string, string>;
  questionOrder: string[];
  optionOrders: Record<string, string[]>;
  activeSessionId: string;
  activeClientInstanceId: string;
  warningCount: number;
  version: number;
}
```

Required index:

```text
unique(examId, candidateId)
```

This replaces the current global `candidateId: unique` rule so one candidate can take multiple exams.

## 5. Publish workflow

Endpoint:

```http
POST /api/v1/admin/exams/:examId/publish
```

The endpoint must:

1. Verify administrator permission.
2. Verify the exam is a valid draft.
3. Validate date, duration, questions and exactly one correct option per question.
4. Select candidates according to the exam eligibility rule.
5. Create one invite per candidate using an idempotent operation.
6. Queue one email notification per invite.
7. Mark the exam as published.
8. Return the number of invitations queued.

Response example:

```json
{
  "examId": "exam-id",
  "status": "published",
  "invitationsCreated": 245,
  "emailsQueued": 245
}
```

Email queuing must not block the publish request. Repeated publish requests must not create duplicate invites or duplicate emails.

## 6. Email notification

Add `exam_invitation` to the existing notification types.

Notification data:

```ts
{
  fullName: string;
  examTitle: string;
  scheduledDate: string;
  durationMinutes: number;
  examUrl: string;
}
```

Example link:

```text
https://<frontend-domain>/exam/invite/<raw-token>
```

The email must not contain answer keys, internal IDs unnecessary for the candidate, or session tokens.

## 7. Invitation validation

Endpoint:

```http
GET /api/v1/exams/invites/:token
```

Rules:

- Candidate must be authenticated using the existing HVK session.
- Hash the supplied token and find the invite.
- Verify the invite belongs to `authOf(req).sub`.
- Reject revoked, expired, archived or unknown invites.
- Return only public exam metadata.
- Never return correct answers.

Possible errors:

```text
401 AUTHENTICATION_REQUIRED
403 INVITE_USER_MISMATCH
404 INVITE_NOT_FOUND
409 INVITE_ALREADY_USED
410 INVITE_EXPIRED
```

## 8. Starting an attempt and single-session enforcement

Endpoint:

```http
POST /api/v1/exams/invites/:token/start
```

The frontend creates a random `clientInstanceId` in `sessionStorage`. A page refresh in the same tab retains this ID; another tab receives a different ID.

The backend must atomically:

1. Verify the authenticated candidate and invite owner.
2. Verify the exam date in `Asia/Kolkata`.
3. Check whether an attempt already exists.
4. Create one attempt if none exists.
5. Generate one server-side `activeSessionId`.
6. Store `activeClientInstanceId`.
7. Mark the invite as started.

If the same candidate opens the same invitation in another tab or device:

```http
409 ACTIVE_SESSION_EXISTS
```

Response:

```json
{
  "error": {
    "code": "ACTIVE_SESSION_EXISTS",
    "message": "This examination is already open in another tab or device."
  }
}
```

The frontend must show a clear dialog and must not allow the second page to answer questions.

Refresh in the original tab must continue to work using the same client instance and server attempt session.

## 9. Candidate exam APIs

Implement or adapt these APIs:

```text
GET  /api/v1/exams/invites/:token
POST /api/v1/exams/invites/:token/start
GET  /api/v1/exams/attempts/:attemptId
PUT  /api/v1/exams/attempts/:attemptId/answers/:questionId
POST /api/v1/exams/attempts/:attemptId/monitoring-events
POST /api/v1/exams/attempts/:attemptId/submit
GET  /api/v1/exams/attempts/:attemptId/result
```

Every attempt request must verify:

- authenticated candidate ownership;
- active server attempt session;
- active client instance where applicable;
- attempt status;
- authoritative server deadline;
- idempotency key for retryable mutations.

Only manual submission creates a score/result. Deadline changes the attempt to `expired` without creating a result.

## 10. Frontend routes

Add or adapt:

```text
/exam/invite/[token]
/exam/[examId]/instructions
/exam/[examId]/attempt
/exam/[examId]/active-session
/exam/[examId]/result
```

The invite page must:

1. Validate the invite.
2. Show exam title, date, duration, camera and security instructions.
3. Require camera permission before starting.
4. Request fullscreen after the candidate clicks Start.
5. Create the client instance ID in `sessionStorage`.
6. Start the attempt through the backend.
7. Show the active-session screen on `409 ACTIVE_SESSION_EXISTS`.

The existing premium exam UI can be reused for question navigation, autosave, monitoring dialogs and manual submission confirmation.

## 11. Security requirements

- Do not trust candidate email or candidate ID from request bodies.
- Use the authenticated HVK user ID as the identity source.
- Store invitation token hashes, never raw tokens.
- Use HTTPS in non-local environments.
- Use `HttpOnly`, `Secure`, `SameSite` session cookies where applicable.
- Rate-limit invite validation and attempt start.
- Do not expose answer keys in any candidate response.
- Do not log raw invitation tokens or session tokens.
- Use idempotency keys for publish, invite creation, answer saves and submit.
- Keep one active attempt per `(examId, candidateId)`.
- Record audit events for publish, invite creation, start, session conflict, monitoring and submit.

Browser tab switching cannot be completely disabled by a normal web browser. Use Page Visibility, fullscreen exit detection, BroadcastChannel/Web Locks and backend audit events as deterrence and evidence signals.

## 12. Migration strategy

Do not directly copy the standalone SQLite backend into HVK.

Recommended order:

1. Add `Exam`, `ExamInvite` and updated `ExamAttempt` models.
2. Add MongoDB indexes.
3. Add admin exam CRUD and publish APIs.
4. Add invitation token service.
5. Add `exam_invitation` email template and outbox job.
6. Add invite validation and start APIs.
7. Add single-session enforcement.
8. Add candidate exam UI routes.
9. Migrate question validation, shuffling, autosave and result logic.
10. Add monitoring and security events.
11. Add admin results and invitation delivery status.
12. Remove or isolate the old payment-triggered provider-only exam flow after migration verification.

Existing payment-based exam access must remain compatible during rollout. Use a feature flag such as:

```text
EXAM_ACCESS_MODE=payment_provider|admin_published|both
```

## 13. Swagger/OpenAPI requirements

Document every new endpoint in the existing HVK OpenAPI generator, including:

- request schemas;
- response schemas;
- authentication requirements;
- `409 ACTIVE_SESSION_EXISTS`;
- invite mismatch and expiry errors;
- idempotency headers;
- attempt session headers if used;
- admin-only operations.

## 14. Testing checklist

### Backend

- Admin can create and publish an exam.
- Invalid exam cannot be published.
- All eligible candidates receive exactly one invite.
- Repeated publish does not duplicate invites or emails.
- Invite token belongs only to the intended candidate.
- Invalid, expired and revoked tokens are rejected.
- Candidate can start only on the scheduled IST date.
- Candidate can start only one attempt per exam.
- Same link in another tab/device returns `ACTIVE_SESSION_EXISTS`.
- Same tab refresh resumes the active attempt.
- Answers are autosaved and idempotent.
- Correct answers never appear in candidate responses.
- Manual submission creates one result.
- Timeout creates `expired` state without a result.
- Monitoring warnings never auto-submit.
- Admin can publish results.

### Frontend

- Invite page handles authentication correctly.
- Valid invite shows instructions.
- Invalid invite shows a clear error state.
- Active session conflict shows a premium dialog/screen.
- Same-tab refresh resumes the exam.
- Second tab cannot answer questions.
- Camera and fullscreen requirements work after user gesture.
- Tab switch and fullscreen exit warnings appear.
- Submit confirmation works.
- Result pending and result published states are clear.
- Mobile and keyboard accessibility are validated.

## 15. Definition of done

The integration is complete when:

- Admin publish creates idempotent candidate invitations.
- Emails are delivered through the existing HVK notification worker.
- Only the intended authenticated candidate can use an invite.
- One candidate cannot run the same exam in multiple tabs/devices.
- Existing HVK login, user records and sessions are reused.
- Candidate APIs never expose answer keys.
- Manual submission is the only scoring/finalization action.
- All API contracts are present in Swagger/OpenAPI.
- Backend and frontend automated tests pass.
- Real-browser testing confirms camera, fullscreen, refresh, tab switch and accessibility behavior.
