# Quickstart & Validation

## Run both apps locally
1. Backend (`hvk-home-backend`) `.env`: `PORT=4000`, `CORS_ORIGINS=http://localhost:3000`,
   `PASSWORD_RESET_URL=http://localhost:3000/reset-password`; then `npm run dev`
   (+ `npm run dev:worker` with Redis for emails).
2. Frontend `.env.local`:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
   NEXT_PUBLIC_DEMO_VIDEO_URL=https://…/demo.mp4
   ```
   then `npm run dev` → http://localhost:3000/registration

## Quality gates
```bash
npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e
```

## Manual validation (against the real backend, Razorpay test mode)
| # | Steps | Expected |
|---|---|---|
| Q1 | Register on `/registration` | Lands on `/onboarding`; candidate visible in Swagger `GET /candidates/me` |
| Q2 | Reload the page | Still signed in |
| Q3 | Skip demo → Pay with a Razorpay test card | "Payment successful" → `/exam` shows the exam link |
| Q4 | Simulate exam completion (signed provider callback via backend Swagger) | `/exam` moves to `/feedback` |
| Q5 | Submit feedback | `/thank-you`; `/result` shows pending until finalized |
| Q6 | Sign out, open `/dashboard` | Redirected to `/login?next=/dashboard` |
| Q7 | Forgot password → link from the worker log/email | Reset works, old session ends |
| Q8 | Open `/` | Home page identical to before |
