# Project Status

**Updated:** 2026-10-16

## Project

HVK Infotech is a Next.js 16.3 / React 19 frontend with two main areas:

- Public marketing homepage at `/`, built from `components/tech/`.
- Candidate portal and TA/admin dashboard under `app/(infotech)/`, connected to the separate `hvk-home-backend` API.

Candidate features include registration, sign-in and password reset, onboarding, Razorpay payment, exam, feedback, results, and profile. Staff users can work with TA leads and payment follow-ups. Session and journey handling live in `lib/session/`, `lib/api/`, `lib/journey.ts`, and `components/portal/portal-gate.tsx`.

## Work Recorded

- Copied the backend Candidate Platform API `spec.md` and `plan.md` into `docs/candidate-platform/`.
- Installed dependencies with `npm ci` using the existing lockfile.
- Started the Next.js development server at <http://localhost:3000>.
- Confirmed the homepage responds with HTTP 200.

## Verification And Notes

- The frontend dev server is running; portal API workflows require the backend, normally at `http://localhost:4000`.
- Automated tests, lint, typecheck, and production build have not been run as part of this update.
- `npm ci` reported 11 dependency audit findings: 2 moderate, 8 high, and 1 critical. No audit remediation has been performed.
- Next.js emitted a Turbopack warning that it ignored a `package-lock.json` in `/Users/suryapandey` outside this repository.
