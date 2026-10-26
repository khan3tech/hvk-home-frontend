# Implementation Plan: Candidate Platform API (Backend)

**Branch**: `001-candidate-platform-api` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-candidate-platform-api/spec.md`

## Summary

A versioned REST API (`/api/v1`) shared by web and mobile clients that owns the candidate
journey: registration/auth (password + OTP) → onboarding demo → Razorpay fee → exam link →
provider-reported completion → feedback → result email, plus Talent Acquisition leads and a
24-hour unpaid follow-up. Express 5 + TypeScript + MongoDB (Mongoose); a separate BullMQ worker
runs delayed/retried work. External vendors sit behind adapters with dev/console defaults so the
open HLD decisions don't block delivery. Details: [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript ~6.0 (strict, ESM) on Node.js 22 LTS (container) / 24 (dev host)

**Primary Dependencies**: express 5, mongoose 9, zod 4, bullmq 5 (ioredis), argon2,
jsonwebtoken, razorpay, pino/pino-http, helmet, cors, express-rate-limit, libphonenumber-js

**Storage**: MongoDB 7 (primary), Redis 7 (job queue, rate-limit store in prod)

**Testing**: Vitest 5, Supertest, mongodb-memory-server; fake adapters for providers/queue

**Target Platform**: Linux containers (Docker Desktop on Windows locally)

**Project Type**: web-service (API + worker, same codebase, two entry points)

**Performance Goals**: p95 < 300 ms for non-provider endpoints at ~50 rps; TA lead within 5 s

**Constraints**: no client-trusted state transitions; idempotent side effects; no secrets in
Git/images; jobs survive restarts

**Scale/Scope**: ~10k candidates/month initially; 13 collections; ~30 endpoints; 3 job types

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How the design complies | Status |
|---|---|---|
| I. Backend source of truth | Onboarding/payment/exam/result state only changed in services; exam completion only via signed provider callback; candidate "complete" endpoint records a claim only | PASS |
| II. Verified payments only | Fee from config; checkout HMAC + webhook raw-body HMAC; `paid` guarded by conditional update and never regresses | PASS |
| III. Idempotent, durable workflows | Unique keys on leads, follow-ups, notifications, webhook events, feedback, results, attempts; BullMQ deterministic jobIds; processors re-read state | PASS |
| IV. Security & privacy | Argon2id; hashed OTP/refresh/reset tokens; Zod everywhere; DTOs; rate limits; RBAC + audit log; pino redaction; `.env.example` only | PASS |
| V. Test-backed delivery | Unit + integration (in-memory Mongo) per story; failure paths enumerated in tasks | PASS |
| VI. Contract-first, versioned | `contracts/` written before code; `/api/v1`; envelope + status map | PASS |
| VII. Observability | Request IDs, pino JSON logs, live/ready health, adapters for all providers | PASS |

Post-design re-check (after data-model + contracts): **PASS**, no violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-candidate-platform-api/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── rest-api.md
│   └── provider-callbacks.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── config/            env.ts, database.ts, redis.ts
├── shared/            errors.ts, logger.ts, http.ts (envelope), crypto.ts, types.ts, phone.ts
├── middleware/        request-id.ts, auth.middleware.ts, validate.middleware.ts,
│                      error.middleware.ts, rate-limit.middleware.ts
├── modules/
│   ├── health/        health.routes.ts
│   ├── auth/          auth.routes.ts, auth.controller.ts, auth.service.ts, auth.schemas.ts,
│   │                  token.service.ts, otp.service.ts, refresh-token.model.ts,
│   │                  otp-challenge.model.ts, password-reset.model.ts, sms.provider.ts
│   ├── candidates/    candidate.model.ts, candidate.repository.ts, candidate.service.ts,
│   │                  candidate.routes.ts, candidate.dto.ts, onboarding-state.ts
│   ├── onboarding/    onboarding.routes.ts, onboarding.service.ts
│   ├── payments/      payment.model.ts, payment.service.ts, razorpay.client.ts,
│   │                  payment.webhook.ts, payment.routes.ts, webhook-event.model.ts
│   ├── exams/         exam-attempt.model.ts, exam.service.ts, exam-provider.adapter.ts,
│   │                  exam.routes.ts
│   ├── feedback/      feedback.model.ts, feedback.service.ts
│   ├── results/       result.model.ts, result.service.ts, result.routes.ts
│   ├── notifications/ notification.model.ts, email.provider.ts, notification.service.ts
│   ├── talent-acquisition/ lead.model.ts, follow-up.model.ts, lead.service.ts,
│   │                  ta.routes.ts, audit-log.model.ts
├── jobs/              queue.ts (JobScheduler + BullMQ impl), processors.ts,
│                      payment-followup.worker.ts, result-email.worker.ts
├── docs/              openapi.ts (OpenAPI 3.1 built from Zod schemas), docs.routes.ts (Swagger UI)
├── container.ts       wires adapters (real vs fake) into services
├── app.ts             builds Express app (no listen)
├── server.ts          API entry
└── worker.ts          worker entry
scripts/               seed-admin.ts
tests/
├── helpers/           test-app.ts (in-memory Mongo + fakes), factories.ts
├── unit/
└── integration/
docker-compose.yml, Dockerfile, .dockerignore, .env.example
```

**Structure Decision**: Single backend project following the LLD §2 module layout, with two
entry points (`server.ts`, `worker.ts`) built from one image. A small `container.ts` does manual
dependency injection so tests can swap providers and the scheduler for fakes.

## Delivery Milestones (maps LLD §13 → user stories)

| # | Milestone | Stories | Exit criteria |
|---|---|---|---|
| M1 | Skeleton: TS/Express/Mongo, health, request IDs, errors, Docker, lint/test | US7 | health tests pass; `docker compose up` healthy |
| M2 | Candidates, register, login, OTP, refresh/logout, password reset, TA lead on register | US1 | auth integration tests incl. enumeration + rate limits |
| M3 | Onboarding status + demo complete/skip | US2 | idempotency tests |
| M4 | Razorpay order/verify/webhook, exam attempt + link, exam-link email | US3 | signature, duplicate & late-webhook tests |
| M5 | Notifications outbox + BullMQ worker; 24 h unpaid follow-up; TA admin APIs + RBAC + audit | US4 | job idempotency + RBAC tests |
| M6 | Provider callback, feedback, results, result-email job with retry policy | US5, US6 | end-to-end journey test |
| M7 | Change request: city/state/PIN code at registration; Swagger UI + OpenAPI 3.1 | US1, FR-030 | validation tests; route-coverage test for docs |
| M8 | Quality gates: GitHub Actions CI/CD, type-aware ESLint + review checklist, coverage thresholds, test-case catalog | Constitution V | CI green on PR; coverage ≥ thresholds; image published from `main` |

Each milestone = its own commit on this branch with green typecheck/lint/tests.

## Complexity Tracking

No constitution violations; table intentionally empty.
