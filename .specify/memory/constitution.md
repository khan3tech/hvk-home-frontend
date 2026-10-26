# HVK Candidate Portal (Frontend) Constitution

## Core Principles

### I. The Backend Is the Source of Truth

The Candidate Platform API (`hvk-home-backend`, `/api/v1`) owns identity, onboarding state,
payment verification, exam access and results. The frontend MUST NOT decide workflow state on
its own: every screen reads the candidate's step from the API (`/onboarding/status`) and only
calls the API to change it. Business rules (fee amount, eligibility, transitions) are never
duplicated in the client; client-side validation mirrors the API's rules for UX only.

### II. Typed, Single API Client

All HTTP calls go through one typed client (`lib/api/`) that understands the backend envelope
`{ data, meta }` / `{ error: { code, message, details } }`, maps `VALIDATION_ERROR.details` to
form fields, and handles 401 by refreshing the session once. Components never call `fetch`
directly. Request/response types mirror `contracts/rest-api.md` of the backend.

### III. Secure Session Handling

- Refresh tokens never live in `localStorage`/`sessionStorage` or in JS-readable cookies; the
  access token lives in memory only.
- No secrets in the browser: only `NEXT_PUBLIC_*` values that are safe to publish (API base URL,
  Razorpay **key id**, demo video URL).
- Payment success is never assumed from the browser: after Razorpay Checkout the app calls
  `POST /payments/verify` and trusts only the API's answer.
- Never log or render tokens, OTPs or signatures.

### IV. The Home Page Is Out of Scope

`app/page.tsx` and `components/tech/**` (the HVK landing site) MUST NOT be changed by this
feature. Candidate-portal work lives under `app/(infotech)/**`, `components/portal/**`,
`components/home/registration-form.tsx` and `lib/**`.

### V. Test-Backed Delivery

Every user journey ships with automated tests: component/unit tests (Vitest + Testing Library,
API mocked with MSW) for forms, guards and state handling, and Playwright end-to-end tests for
the main journey with the API mocked at the network layer. `typecheck`, `lint` (zero
warnings), `test` and `build` MUST pass before a milestone is committed.

### VI. Accessible, Responsive, Consistent UI

New screens reuse the existing design system (`components/ui/*`, Tailwind tokens, dark mode,
framer-motion patterns). Forms have labels, inline errors announced to assistive tech, keyboard
access and visible focus; layouts work from 360 px phones up.

## Technology & Platform Constraints

- Next.js 16 (App Router; `proxy.ts` replaces middleware), React 19, TypeScript strict,
  Tailwind 3, react-hook-form + Zod, lucide-react, framer-motion.
- Razorpay Checkout (`checkout.js`) for payments, with orders created by the backend.
- Separate repository from the backend; it talks to the backend over HTTPS with a CORS allowlist.

## Development Workflow & Quality Gates

- Spec-Driven Development with GitHub Spec Kit: constitution → specify → plan → tasks →
  implement, in `specs/NNN-slug/` on a matching branch, one commit per milestone.
- Changes the frontend needs from the backend are raised as backend change requests in the
  backend repo's spec, never worked around in the client.
- Work in progress that predates spec-kit is never committed or rewritten without the owner's
  approval.

## Governance

This constitution governs the frontend repository. Amendments require a PR updating this file
with a semantic version bump (MAJOR: principle removal/redefinition; MINOR: new principle or
section; PATCH: clarification). Every plan includes a Constitution Check.

**Version**: 1.0.0 | **Ratified**: 2026-10-14 | **Last Amended**: 2026-10-14
