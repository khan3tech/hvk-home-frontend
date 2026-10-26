# Product Requirements

## Status

Approved planning baseline. This document describes the first release only; authentication integration remains an external dependency.

## Objective

Provide a reliable online examination platform with a React frontend and Node.js backend. Administrators configure and publish exams; eligible authenticated candidates complete one timed attempt; objective answers are autosaved, evaluated, and published according to administrator policy.

## Scope

### First release

- Fixed calendar-date exams using `Asia/Kolkata`.
- Candidate may start at any time on the configured date.
- Candidate must finish by 23:59:59 IST on that date.
- Admin-configured duration, such as 30, 45, or 60 minutes.
- One attempt per candidate per exam.
- Single-choice objective questions.
- Shuffled question order and option order.
- No images in questions.
- No negative marking.
- Full marks only for the correct option.
- Camera permission mandatory before starting.
- Client-side face-count monitoring signal.
- Monitoring warnings are recorded and shown to the candidate; they do not automatically submit or fail the attempt.
- Automatic objective scoring.
- Admin-controlled result publication.
- Candidate sees the final score only while cutoff evaluation is disabled.

### Deferred

- Fixed-start-time exams and late-entry windows.
- Pause, resume, restart, retake, rescheduling, and cancellation workflows.
- Subjective questions and manual evaluation.
- Question images and attachments.
- Multiple-choice partial marking.
- Video or image retention.
- Identity verification or biometric matching.
- Candidate-specific extensions.

## Actors

- Candidate: completes one eligible attempt.
- Administrator: creates exams, questions, marking rules, eligibility, and publication settings.
- Evaluator: future role for subjective marking; not required in release one.
- System worker: finalizes expired attempts and records operational events.

## Functional requirements

| ID | Requirement | Acceptance criterion |
|---|---|---|
| FR-01 | Admin creates an exam | Required title, date, duration, passing rule, and publication policy validate before save. |
| FR-02 | Admin manages questions | A published exam has a valid single correct option per question. |
| FR-03 | Candidate eligibility is server-checked | Ineligible, duplicate, or unavailable candidates cannot start. |
| FR-04 | Date availability uses IST | Start is accepted only during the configured calendar date in `Asia/Kolkata`. |
| FR-05 | Attempt deadline is authoritative | Deadline is the earlier of the configured date end and start time plus duration. |
| FR-06 | Answers autosave | A successful save is acknowledged and recoverable after refresh/reconnect. |
| FR-07 | Finalization is idempotent | Repeated manual submit requests produce one final attempt and one result. |
| FR-08 | Monitoring warnings are recorded | Monitoring events increment the warning count without automatically submitting or failing the attempt. |
| FR-09 | Correct answers are protected | Candidate payloads never contain answer keys or trusted scores. |
| FR-10 | Results are controlled | Candidate sees only a published final score and qualification status. |

## Non-functional requirements

- Backend rules are authoritative; frontend controls are advisory.
- Every protected request is authenticated, authorized, validated, and audited where appropriate.
- Attempt operations tolerate retries, refreshes, late requests, and connection loss.
- Candidate answers remain available after browser closure if successfully saved.
- Monitoring data is minimized; no camera frames or video are retained by default.
- The system must expose operational logs and support backup/recovery procedures.

## Qualification

An administrator configures either passing marks or passing percentage for each exam. The platform must reject ambiguous or missing rules before publication. Qualification is calculated only after objective evaluation and is exposed as `QUALIFIED` or `NOT_QUALIFIED`; unpublished results remain unavailable to candidates.
