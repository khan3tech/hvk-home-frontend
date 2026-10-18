# HVK Exam Frontend Implementation

This document defines the frontend work for the exam module. It complements `hvk-home-backend/docs/exam/EXAM_IMPLEMENTATION.md` and preserves the decisions made in the standalone exam prototype.

## Routes

Add or adapt:

```text
/exam/invite/[token]
/exam/[examId]/instructions
/exam/[examId]/attempt
/exam/[examId]/active-session
/exam/[examId]/result
```

Reuse the existing HVK session provider, authenticated API client, portal layout, admin layout and error handling.

## Candidate flow

1. Candidate opens the emailed invitation.
2. If unauthenticated, redirect to HVK login and preserve the invitation URL.
3. Validate the invitation through the backend.
4. Show exam title, scheduled date, duration, camera requirement, fullscreen guidance, autosave and manual-submission rules.
5. Create a random tab-specific `clientInstanceId` in `sessionStorage`.
6. Start the attempt after the candidate clicks Start.
7. Request camera and fullscreen only from the user gesture.
8. Render the premium question/option UI and autosave answers.
9. Show a custom confirmation dialog before manual submission.
10. Show result pending until admin publication.

## Active-session conflict

When the backend returns `409 ACTIVE_SESSION_EXISTS`, navigate to the active-session state and show:

> This examination is already open in another tab or device. Return to the original examination window to continue.

Do not show questions or allow answer interactions in this state. Same-tab refresh must reuse the session stored for that tab and resume the attempt.

Use BroadcastChannel or Web Locks for fast client-side detection, but never use them as the only security control.

## Security and monitoring

Keep the existing exam behavior:

- Camera permission is mandatory.
- No camera video or images are uploaded.
- BlazeFace runs locally in the browser to detect `NO_FACE` and `MULTIPLE_FACE`; only the minimized event type is sent to the backend.
- Multiple face, no face, camera lost, tab hidden and fullscreen exit are audit events.
- Monitoring warnings are capped at five.
- Warnings do not auto-submit or auto-fail the attempt.
- Browser refresh/close shows leave confirmation while an attempt is active.
- Deadline is authoritative on the backend.

Normal browsers cannot fully disable tab switching. Detection, warning, fullscreen exit handling and backend audit are the supported behavior.

## UI states

Implement clear premium states for:

- Loading invitation
- Login required
- Invalid/expired/revoked invitation
- Instructions
- Camera permission required
- Fullscreen required or exited
- Active session conflict
- In progress
- Saving/saved/offline/reconnecting
- Time expired without submission
- Submission confirmation
- Result pending
- Result published
- API or network error

Do not display raw backend codes such as `ACTIVE_SESSION_EXISTS` to candidates.

## Frontend acceptance tests

- Invitation URL is preserved through login.
- Valid invitation loads only for the intended authenticated candidate.
- Second tab shows active-session state and cannot answer.
- Same-tab refresh resumes the attempt.
- Camera and fullscreen requests happen after a user gesture.
- Tab switch and fullscreen exit display custom warnings.
- Warning count displays `x/5`.
- No-face and multiple-face detections display an accessible security dialog.
- Answers autosave and recover after reconnect.
- Submit confirmation is required and manual submission works.
- Timeout shows expired/not-submitted state.
- Result pending and published states are clear.
- Keyboard navigation, focus, contrast and responsive layouts are validated in a real browser.
