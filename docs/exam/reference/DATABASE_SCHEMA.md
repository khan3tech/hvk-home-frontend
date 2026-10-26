# Database Schema

The executable local implementation uses Node.js `node:sqlite` with an explicit, versioned migration runner in [`backend/src/migrations.js`](../backend/src/migrations.js). Production uses the pooled PostgreSQL adapter in [`backend/src/postgres.js`](../backend/src/postgres.js), selected by `DATABASE_DRIVER=postgres` and `DATABASE_URL`. The SQL migration files are maintained in [`backend/migrations/`](../backend/migrations/), record applied versions in `schema_migrations`, keep compact JSON snapshots on core rows for compatibility, and persist the normalized relational model below. A reviewable SQL snapshot is available at [`DATABASE_SCHEMA.sql`](./DATABASE_SCHEMA.sql), with operational steps in [`DATABASE_MIGRATION_GUIDE.md`](./DATABASE_MIGRATION_GUIDE.md). The HTTP/domain layer does not depend on SQLite-specific persistence behavior.

## Core entities

| Entity | Purpose |
|---|---|
| `candidates` | Local reference to an externally authenticated user. |
| `administrators` | Admin role and authorization reference. |
| `exams` | Date, duration, status, qualification, and publication policy. |
| `exam_eligibility` | Candidate or group eligibility. |
| `questions` | Reusable question definition and type. |
| `question_options` | Options and private correctness value. |
| `exam_questions` | Exam-specific question order and marks. |
| `attempts` | One candidate attempt, deadline, session, and lifecycle. |
| `attempt_questions` | Frozen question/option order for an attempt. |
| `answers` | Latest answer state and save metadata. |
| `results` | Immutable calculated score and qualification outcome. |
| `monitoring_events` | Minimized event metadata and warning count. |
| `audit_events` | Administrative and security-relevant history. |

## Implemented relational tables

- `candidates`: external authenticated candidate references and last-seen time.
- `administrators`: external administrator references; authentication remains injected by the host application.
- `questions` and `question_options`: question text, ordered options, and private correctness flags. Option identity is scoped by question.
- `exam_questions`: exam-specific question order and marks.
- `exam_eligibility`: normalized candidate allow-list per exam.
- `attempt_questions`: frozen question and option order for each attempt.
- `answers`: latest server-accepted answer, save timestamp, and revision.
- `monitoring_events`: minimized warning signals; no camera frames or video.

The original `questions_json`, `answer_keys_json`, `eligible_candidates_json`, `answers_json`, `question_order_json`, and `option_orders_json` columns remain as authoritative compatibility snapshots while both representations are written transactionally at the relevant workflow boundaries. Existing databases are upgraded on startup, including the scoped option-key migration.

## Important constraints

- Unique `(exam_id, candidate_id)` on `attempts`.
- Unique `(attempt_id, question_id)` on `attempt_questions` and `answers`.
- At most one active session per attempt.
- Attempt state transitions validated transactionally.
- Answer updates rejected when attempt state is final.
- One result per attempt.
- Exam cannot publish without valid question and marking configuration.

## Suggested attempt fields

`id`, `exam_id`, `candidate_id`, `state`, `started_at`, `deadline_at`, `finalized_at`, `finalization_reason`, `active_session_id`, `warning_count`, `version`, `question_order_json`, `option_orders_json`, `created_at`, `updated_at`.

The executable schema additionally stores `question_order_json` and `option_orders_json`. These are frozen when the attempt starts so refreshes and reconnects cannot change the candidate's presentation order.

## Indexes

- `attempts(exam_id, candidate_id)` unique
- `attempts(state, deadline_at)` for expiry recovery
- `answers(attempt_id, question_id)` unique
- `monitoring_events(attempt_id, occurred_at)`
- `audit_events(entity_type, entity_id, occurred_at)`

## Transactions

Use a transaction for manual submit, automatic expiry, warning-threshold submission, and result creation. Lock or compare-and-swap the attempt row so simultaneous requests have one winner. The losing request returns the final state rather than creating duplicate work.

## Retention

Define retention per data category before production. Candidate answers and final results generally require longer retention than transient monitoring events. Do not retain camera frames or video in release one.
