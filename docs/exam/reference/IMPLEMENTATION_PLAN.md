# Implementation Plan

## Milestone 0: Integration discovery

Obtain the existing authentication contract, user identifier, admin role source, domains, session/token behavior, and database ownership. Acceptance: a signed-off integration contract.

## Milestone 1: Backend foundation

Create Node.js service boundaries, configuration, logging, authentication adapter, authorization, database access, migrations, and health checks. Acceptance: authenticated protected endpoint and operational local setup.

## Milestone 2: Exam and question management

Implement admin exam CRUD, single-choice question editing, validation, shuffle configuration, passing rule, and publication. Acceptance: invalid exams cannot publish.

## Milestone 3: Candidate attempts

Implement date availability, IST deadline, one attempt, single-session policy, public question delivery, and attempt states. Acceptance: all scheduling boundary tests pass.

## Milestone 4: Autosave and finalization

Implement answer saves, idempotency, offline retry contract, manual submit, expiry sweep, transaction locking/versioning, and objective scoring. Acceptance: refresh, retry, race, and restart tests pass.

## Milestone 5: React candidate interface

Implement pre-exam, camera readiness, workspace, timer, save status, warning, and submission states. Acceptance: UI never presents client state as authoritative.

## Milestone 6: Monitoring and admin results

Implement local face-count signal integration, event API, warning policy, attempt review, and result publication. Acceptance: two warnings auto-submit and publication access is correct.

## Milestone 7: Hardening and release

Run security review, accessibility, browser matrix, load tests, backups, observability, privacy/legal review, and operational rehearsal. Acceptance: release checklist signed off.

## Current executable baseline

The repository currently includes a durable Node.js/SQLite backend, React/Vite frontend, admin exam creation, candidate attempts, answer persistence, expiry recovery, objective scoring, result publication, camera readiness, local BlazeFace monitoring, Dockerfiles, and Docker Compose. The existing website authentication contract is still required before production authorization can be signed off.
