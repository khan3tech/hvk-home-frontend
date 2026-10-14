# Frontend routes

| Route | Access | Purpose |
|---|---|---|
| `/` | public | Home (HVK landing) — **unchanged** |
| `/registration` | public | Marketing sections + account registration form |
| `/login` | public (redirects to `/dashboard` if signed in) | Password / OTP sign-in; honours `?next=` |
| `/forgot-password`, `/reset-password?token=` | public | Password reset |
| `/terms`, `/privacy-policy` | public | Unchanged |
| `/dashboard` | session | Journey stepper + primary action |
| `/onboarding` | session, step `demo_pending` | Demo video (complete/skip) |
| `/payment` | session, step `fee_pending` | Fee + Razorpay Checkout + verify |
| `/exam` | session, steps `exam_ready`, `exam_in_progress` | Start exam / I've finished / waiting |
| `/feedback` | session, step `exam_completed` | Feedback form |
| `/thank-you` | session, step ≥ `feedback_submitted` | Thank-you |
| `/result` | session, step ≥ `feedback_submitted` | Pending / published result |
| `/profile` | session | View/edit profile |
| `/admin` → `/admin/leads` | role `ta`/`admin` | Lead list (filters, pagination) |
| `/admin/leads/[id]` | role `ta`/`admin` | Lead detail: status, assign, next action, notes |
| `/admin/follow-ups` | role `ta`/`admin` | Unpaid-payment follow-ups |
| `/registration/callback` | legacy | Redirect → `/dashboard` |
| `/exam/access/[token]` | legacy | Redirect → `/login?next=/exam` |

## Step → route (journey router)

| `onboardingStep` | Route | Primary action label |
|---|---|---|
| `registered`, `demo_pending` | `/onboarding` | Watch demo |
| `fee_pending` | `/payment` | Pay registration fee |
| `exam_ready`, `exam_in_progress` | `/exam` | Go to exam |
| `exam_completed` | `/feedback` | Give feedback |
| `feedback_submitted` | `/thank-you` | View result status |
| `completed` | `/result` | View result |

After sign-in, staff (`ta`/`admin`) go to `/admin` and candidates go to their step's route.
Candidates opening `/admin/**` are redirected to `/dashboard`; staff opening candidate pages are
redirected to `/admin`.

A step page visited out of order redirects to its step's route. `/dashboard`, `/profile` and
`/result` (once the step is at least `feedback_submitted`) are always reachable.
