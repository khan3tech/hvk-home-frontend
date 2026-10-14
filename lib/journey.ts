import type { OnboardingStep, Role } from "@/types/api";
import { ONBOARDING_STEPS } from "@/types/api";

/** Candidate journey (contracts/routes.md): which route serves each onboarding step. */
export const STEP_ROUTE: Record<OnboardingStep, string> = {
  registered: "/onboarding",
  demo_pending: "/onboarding",
  fee_pending: "/payment",
  exam_ready: "/exam",
  exam_in_progress: "/exam",
  exam_completed: "/feedback",
  feedback_submitted: "/thank-you",
  completed: "/result",
};

export const STEP_ACTION: Record<OnboardingStep, string> = {
  registered: "Watch demo",
  demo_pending: "Watch demo",
  fee_pending: "Pay registration fee",
  exam_ready: "Go to exam",
  exam_in_progress: "Go to exam",
  exam_completed: "Give feedback",
  feedback_submitted: "View result status",
  completed: "View result",
};

/** Stepper stages shown on the dashboard, with the steps that belong to each. */
export const STAGES: { label: string; steps: OnboardingStep[] }[] = [
  { label: "Registered", steps: ["registered"] },
  { label: "Demo", steps: ["demo_pending"] },
  { label: "Payment", steps: ["fee_pending"] },
  { label: "Exam", steps: ["exam_ready", "exam_in_progress"] },
  { label: "Feedback", steps: ["exam_completed"] },
  { label: "Result", steps: ["feedback_submitted", "completed"] },
];

export function stepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step);
}

export function isStaff(role: Role | undefined): boolean {
  return role === "ta" || role === "admin";
}

/** Where to send a user after sign-in, honouring a safe same-site `next` path. */
export function homeFor(role: Role, next?: string | null): string {
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  if (isStaff(role)) return safeNext?.startsWith("/admin") ? safeNext : "/admin";
  return safeNext && !safeNext.startsWith("/admin") ? safeNext : "/dashboard";
}

/** Pages always reachable by a signed-in candidate regardless of step. */
const FREE_PAGES = ["/dashboard", "/profile"];

/**
 * Returns the route a candidate should be redirected to when visiting `pathname` at `step`,
 * or null when the page is allowed. Step pages are only reachable at their step; result and
 * thank-you stay reachable once the candidate has reached them.
 */
export function redirectForStep(pathname: string, step: OnboardingStep): string | null {
  if (FREE_PAGES.includes(pathname)) return null;
  const own = STEP_ROUTE[step];
  if (pathname === own) return null;
  const reached = stepIndex(step) >= stepIndex("feedback_submitted");
  if ((pathname === "/result" || pathname === "/thank-you") && reached) return null;
  const isStepPage = Object.values(STEP_ROUTE).includes(pathname);
  return isStepPage ? own : null;
}
