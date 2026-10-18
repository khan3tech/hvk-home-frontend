/**
 * Types mirroring the Candidate Platform API contract
 * (hvk-home-backend: specs/001-candidate-platform-api/contracts/rest-api.md, Swagger at /api/docs).
 */

export const ONBOARDING_STEPS = [
  "registered",
  "demo_pending",
  "fee_pending",
  "exam_ready",
  "exam_in_progress",
  "exam_completed",
  "feedback_submitted",
  "completed",
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export type Role = "candidate" | "ta" | "admin";

export interface ApiSuccess<T> {
  data: T;
  meta: { requestId: string };
}

export interface ApiErrorBody {
  error: { code: string; message: string; details: { path: string; message: string }[] };
  meta: { requestId: string };
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  college: string | null;
  place: string | null;
  role: Role;
  onboardingStep: OnboardingStep;
  demoAction: "completed" | "skipped" | null;
  createdAt: string | null;
}

/** Web clients use cookie session mode, so the refresh token never appears in the body. */
export interface AuthResult {
  accessToken: string;
  accessTokenExpiresIn: number;
  candidate: Candidate;
}

export interface RegisterResult extends AuthResult {
  nextStep: OnboardingStep;
}

export interface OtpChallenge {
  challengeId: string;
  expiresInSeconds: number;
}

export interface OnboardingStatus {
  step: OnboardingStep;
  demoAction: "completed" | "skipped" | null;
  nextStep: OnboardingStep | null;
}

export type PaymentStatus = "created" | "pending" | "paid" | "failed" | "cancelled" | "expired" | "refunded";

export interface Payment {
  id: string;
  status: PaymentStatus;
  amountMinor: number;
  currency: string;
  providerOrderId: string;
  verifiedAt: string | null;
  createdAt: string | null;
}

export interface CheckoutOptions {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  prefill: { name: string; email: string; contact: string };
}

export interface CreateOrderResult {
  payment: Payment;
  checkout: CheckoutOptions;
}

export type AttemptStatus = "created" | "link_issued" | "in_progress" | "completed" | "abandoned" | "invalidated";

export interface Exam {
  attemptId: string;
  status: AttemptStatus;
  examUrl: string | null;
  completedAt: string | null;
}

export interface ManagedExamInvite {
  id: string;
  title: string;
  description: string;
  scheduledDate: string;
  durationMinutes: number;
  status: "published";
  questionCount: number;
  resultPublished: boolean;
  inviteId: string;
  inviteStatus: "invited" | "started" | "submitted" | "expired" | "revoked";
}

export interface ManagedExamQuestion {
  id: string;
  prompt: string;
  marks: number;
  options: { id: string; label: string }[];
}

export interface ManagedExamAttempt {
  id: string;
  examId: string;
  state: "in_progress" | "submitted" | "expired";
  startedAt: string;
  deadlineAt: string;
  completedAt: string | null;
  finalizationReason: "manual" | "deadline" | null;
  answers: Record<string, string>;
  version: number;
  warningCount: number;
  score: number | null;
  totalMarks: number | null;
  resultPublished: boolean;
  sessionId?: string;
  questions: ManagedExamQuestion[];
}

export interface ManagedExamAnswerSave {
  serverRevision: number;
  savedAt: string;
  attemptState: string;
}

export interface VerifyPaymentResult {
  payment: Payment;
  exam: Exam;
}

export interface Result {
  attemptId: string;
  status: "pending" | "published";
  score: number | null;
  outcome: "pass" | "fail" | null;
  publishedAt: string | null;
}

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export const LEAD_STATUSES = ["new", "queued", "assigned", "contacted", "in_progress", "resolved", "closed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const FOLLOW_UP_STATUSES = ["open", "in_progress", "done", "cancelled"] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

export interface CandidateSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string | null;
  state: string | null;
  college: string | null;
  place: string | null;
  onboardingStep: OnboardingStep;
}

export interface TaLead {
  id: string;
  candidate: CandidateSummary | null;
  status: LeadStatus;
  assignedTo: string | null;
  lastContactAt: string | null;
  nextActionAt: string | null;
  notes: { by: string; text: string; at: string }[];
  createdAt: string | null;
}

export interface FollowUp {
  id: string;
  type: "unpaid_payment";
  candidate: CandidateSummary | null;
  dueAt: string;
  status: FollowUpStatus;
  assignedTo: string | null;
  completedAt: string | null;
  outcome: string | null;
}

export interface StaffMember {
  id: string;
  fullName: string;
  role: "ta" | "admin";
}
