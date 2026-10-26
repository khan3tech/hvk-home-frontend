# Decisions and Assumptions

## Confirmed decisions

- Exam uses administrator-selected fixed calendar date.
- Candidate may begin at any time on that date.
- All exam business time uses India Standard Time (`Asia/Kolkata`).
- Duration is configurable per exam.
- Candidate must finish by the end of the exam date; the effective deadline is the earlier of duration expiry and date end.
- No late-entry exceptions.
- No pause, resume, restart, or retake.
- One attempt per candidate per exam.
- No exam rescheduling/cancellation workflow in release one.
- One active browser/device session per attempt.
- Release-one questions are single-choice with shuffled questions and options.
- No question images.
- No negative marking.
- Correct answer receives full marks; incorrect/unanswered receives zero.
- Result publication is administrator-controlled.
- Candidate sees only final score and qualification status.
- Camera monitoring is mandatory.
- Camera permission failure prevents starting; retry instructions are shown.
- Two total monitoring warnings automatically submit the attempt.
- No camera images or video are retained in release one.
- Frontend is React and backend is Node.js.
- The executable local baseline uses Node.js `node:sqlite` for durable development persistence.
- The backend exposes an injectable authentication adapter; development identity headers are disabled by the production default.
- The executable local baseline uses TensorFlow.js BlazeFace with `tfjs-core`, converter, and WebGL/CPU backends for local browser face-count detection; model performance remains a release gate.
- Authentication transport is an HttpOnly, Secure, SameSite cookie session for the browser application; the server, not frontend JavaScript, reads the session.
- Authentication sessions expire after 24 hours; logout and upstream session revocation must invalidate access immediately.
- The immutable candidate identity used by exam authorization is the authenticated user's email address.
- Administrator access is granted only from a server-verified administrator role/claim in the existing authentication system.
- JWT is not stored in localStorage or exposed to browser JavaScript; if the existing provider uses JWT internally, the backend verifies it behind the cookie/session adapter.

## Temporary assumptions

- The backend will use a relational database; engine and ORM are not selected.
- Existing authentication is external and will be integrated through an adapter; provider, cookie name, verification endpoint/secret, and role claim remain deployment inputs.
- Production cookie domain is intentionally deferred until the frontend/backend domains are selected.
- Subjective evaluation is deferred but the model remains extensible.
- Monitoring events are metadata only and are reviewable by authorized administrators.

## Risks and owners

| Risk | Owner |
|---|---|
| Authentication contract unavailable | Product/integration owner |
| Camera false positives and accessibility | Product, security, and legal reviewers |
| Late-start date-end behavior | Product owner; decision recorded above |
| Scheduler/worker reliability | Backend owner |
| Privacy notice and retention compliance | Legal/privacy owner |
