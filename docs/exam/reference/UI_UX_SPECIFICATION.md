# UI/UX Specification

## Candidate screens

1. Exam list: availability date, duration, status, and result publication state.
2. Pre-exam instructions: date rule, duration, camera consent, warning policy, autosave, and submission behavior.
3. Camera readiness: permission state, live preview indicator, retry instructions, and accessible error text.
4. Exam workspace: question navigation, shuffled questions/options, selected answer state, save status, IST deadline, and remaining time.
5. Monitoring warning: prominent warning count and corrective instruction.
6. Submission confirmation: ordinary manual-submit confirmation only.
7. Submitted state: clear server-confirmed status; never imply completion before backend acknowledgement.
8. Result state: `Pending` or published final score and qualification status only.

## Required states

Not available, eligible, camera required, camera unavailable, in progress, saving, saved, offline, reconnecting, submission in progress, submitted, auto-submitted, expired, result pending, and result published.

## Admin screens

- Exam list and status.
- Exam configuration: date, duration, questions, passing marks/percentage, eligibility, monitoring policy, and result publication.
- Single-choice question editor with exactly one correct option.
- Question ordering/shuffle configuration.
- Attempt and monitoring review.
- Result publication control.

## Accessibility

Use keyboard navigation, visible focus, labels, error announcements, sufficient contrast, responsive layouts, and a support path for camera/accessibility issues. Do not make color the only warning signal.

