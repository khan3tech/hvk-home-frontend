# Backend API consumed by the portal

Source of truth: `hvk-home-backend/specs/001-candidate-platform-api/contracts/rest-api.md` and the
live Swagger at `{API}/api/docs`. Base: `${NEXT_PUBLIC_API_BASE_URL}/api/v1`.

| Screen | Call | Notes |
|---|---|---|
| Registration | `POST /auth/register` | body: fullName, email, phone (`+91…`), city, state, pincode, college, place, password, acceptTerms |
| Login | `POST /auth/login` | `{ emailOrPhone, password }` |
| Login (OTP) | `POST /auth/otp/request` → `POST /auth/otp/verify` | 60 s resend cooldown; `challengeId` from the request call |
| Session restore | `POST /auth/refresh` | with cookie (D2 = A); returns new access token + candidate |
| Sign out | `POST /auth/logout` | clears cookie (D2 = A) |
| Forgot / reset | `POST /auth/password/forgot`, `POST /auth/password/reset` | reset link: `/reset-password?token=…` |
| Profile | `GET /candidates/me`, `PATCH /candidates/me` | editable: fullName, city, state, pincode, college, place (after B2) |
| Journey | `GET /onboarding/status` | `{ step, demoAction, nextStep }` |
| Demo | `POST /onboarding/demo/complete` · `/demo/skip` | idempotent |
| Payment | `POST /payments/orders` → Checkout → `POST /payments/verify`; `GET /payments/me` | fee shown from `checkout.amount` / `currency` |
| Exam | `GET /exams/current`, `POST /exams/attempts/:id/complete` | complete = claim only |
| Feedback | `POST /exams/attempts/:id/feedback` | `{ rating 1–5, answers?, comments? }` |
| Result | `GET /results/me` | `null` / `pending` / `published` |
| TA leads | `GET /admin/ta-leads?status&from&to&page&limit`, `GET/PATCH /admin/ta-leads/:id` | PATCH: status, assignedTo, nextActionAt, note |
| TA follow-ups | `GET /admin/payments/pending-follow-up?status&page&limit`, `PATCH /admin/follow-ups/:id` | status, outcome, assignedTo |
| TA staff picker | `GET /admin/staff` | **new (backend B4)** |

## Error code → message

| `error.code` | HTTP | Message shown |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Field messages from `details` (`body.email` → email field); else "Please check the highlighted fields." |
| `BAD_REQUEST` | 400 | "Something about that request wasn't right. Please try again." |
| `INVALID_TOKEN` | 400 | "This reset link is invalid or has expired. Request a new one." |
| `INVALID_CREDENTIALS` | 401 | "Incorrect details. Please try again." (login/OTP) |
| `UNAUTHENTICATED` | 401 | Silent refresh, then redirect to `/login` |
| `INVALID_SIGNATURE` | 401 | Payment: "We couldn't confirm your payment yet." → start verify polling |
| `FORBIDDEN` | 403 | "You don't have access to this page." |
| `NOT_FOUND` | 404 | "We couldn't find that." |
| `ACCOUNT_EXISTS` | 409 | "An account with these details already exists. Sign in instead." |
| `FEEDBACK_EXISTS` | 409 | "We already have your feedback — thank you!" |
| `INVALID_STATE` | 422 | Re-load status and route to the correct step |
| `RATE_LIMITED` | 429 | "Too many attempts. Please wait a moment and try again." |
| `INTERNAL_ERROR` | 500 | "Something went wrong on our side. Please try again." |
| `NETWORK_ERROR` (client) | — | "Could not reach the server. Check your connection and try again." |
