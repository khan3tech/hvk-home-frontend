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

/** How candidates pay: online (Razorpay) or manually, with staff approving payments received outside the app. */
export interface PaymentConfig {
  mode: "razorpay" | "manual";
  feeMinor: number;
  currency: string;
  /** Manual mode: how and where to pay. */
  instructions: string;
}

export const MANUAL_METHODS = ["cash", "upi_qr", "bank_transfer", "other"] as const;
export type ManualMethod = (typeof MANUAL_METHODS)[number];

/** A registered candidate with no approved payment yet. */
export interface PendingCandidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  college: string | null;
  city: string | null;
  step: string;
  registeredAt: string | null;
}

export interface ManualApproval {
  id: string;
  candidateId: string;
  candidateName: string;
  amountMinor: number;
  currency: string;
  method: ManualMethod | null;
  reference: string | null;
  note: string | null;
  approvedAt: string | null;
  /** Name of the staff member who approved it. */
  approvedBy: string | null;
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
  /** `managed`: the built-in exam via a personal link valid 24 hours; `external`: provider link. */
  mode?: "managed" | "external";
  /** Managed mode: `pending` until an exam for paid candidates is published. */
  linkStatus?: "pending" | "active" | "expired" | "started" | "submitted" | null;
  linkExpiresAt?: string | null;
}

export interface ManagedExamInvite {
  id: string;
  title: string;
  description: string;
  scheduledDate: string;
  durationMinutes: number;
  status: "published" | "archived";
  questionCount: number;
  resultPublished: boolean;
  inviteId: string;
  inviteStatus: "invited" | "started" | "submitted" | "expired" | "revoked";
  hasAttempt?: boolean;
  /** Set for links issued after payment: usable until this time, on any day. */
  expiresAt?: string | null;
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
  qualification?: "QUALIFIED" | "NOT_QUALIFIED" | "NOT_EVALUATED";
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

/** One lesson as the candidate sees it (the video's storage key is never sent to the browser). */
export interface LearningLesson {
  id: string;
  title: string;
  sectionTitle: string;
  sectionPosition: number;
  position: number;
  durationSeconds: number;
  completed: boolean;
  /** Where playback resumes. */
  positionSeconds: number;
  /** First video of its course: free to watch before the payment is approved (manual-payment mode). */
  preview: boolean;
}

export interface LearningCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  /** Display order; the API already returns courses sorted by it. */
  position: number;
  lessonCount: number;
  completedCount: number;
  durationSeconds: number;
  /** No videos yet: listed, but nothing to play. */
  comingSoon: boolean;
  lessons: LearningLesson[];
}

export interface LearningTrackCourse {
  id: string;
  title: string;
  slug: string;
  comingSoon: boolean;
  lessonCount: number;
  completedCount: number;
  durationSeconds: number;
}

/** A career track (for example Frontend Developer): an ordered list of courses. */
export interface LearningTrack {
  id: string;
  title: string;
  slug: string;
  description: string;
  position: number;
  /** The domain heading it is grouped under (empty when it stands alone), and that heading's order. */
  domain: string;
  domainPosition: number;
  /** False while none of its courses has videos ("Coming soon") or it is held back: it cannot be chosen. */
  available: boolean;
  /** The track this user chose. */
  selected: boolean;
  courseCount: number;
  availableCourseCount: number;
  lessonCount: number;
  completedCount: number;
  durationSeconds: number;
  courses: LearningTrackCourse[];
}

export interface LessonProgressResult {
  lessonId: string;
  positionSeconds: number;
  completed: boolean;
}

export interface PlaybackLink {
  /** Short-lived signed video link. */
  url: string;
  expiresAt: string;
}

export const ENQUIRY_STATUSES = ["new", "in_progress", "resolved"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

/** A message sent through the website's "Talk to us" form. */
export interface Enquiry {
  id: string;
  email: string;
  /** E.164 */
  phone: string;
  message: string;
  source: string;
  status: EnquiryStatus;
  createdAt: string | null;
}

/** Course exams and domain exams (spec 007). */
export type SkillExamScope = "course" | "domain";

export interface SkillExamQuestionDraft {
  id: string;
  prompt: string;
  marks: number;
  options: { id: string; label: string; isCorrect: boolean }[];
}

export interface SkillExamInput {
  scope: SkillExamScope;
  courseId?: string;
  domain?: string;
  title: string;
  description?: string;
  durationMinutes: number;
  passPercentage: number;
  questions: SkillExamQuestionDraft[];
}

export interface SkillExamAdmin {
  id: string;
  scope: SkillExamScope;
  courseId: string | null;
  domain: string;
  targetTitle: string;
  title: string;
  description: string;
  durationMinutes: number;
  passPercentage: number;
  status: "draft" | "published" | "archived";
  questionCount: number;
  attemptCount: number;
  publishedAt: string | null;
}

export interface SkillExamAdminDetail extends SkillExamAdmin {
  questions: SkillExamQuestionDraft[];
}

export interface SkillExamTargets {
  courses: { id: string; title: string; status: string; examId: string | null; examStatus: "draft" | "published" | null }[];
  domains: { name: string; examId: string | null; examStatus: "draft" | "published" | null }[];
}

/** A published exam as a candidate sees it. */
export interface SkillExam {
  id: string;
  scope: SkillExamScope;
  courseId: string | null;
  domain: string;
  targetTitle: string;
  title: string;
  description: string;
  durationMinutes: number;
  passPercentage: number;
  questionCount: number;
  /** False until the payment is approved. */
  unlocked: boolean;
  attempts: number;
  bestPercentage: number | null;
  passed: boolean;
  openAttemptId: string | null;
}

export interface SkillAttempt {
  id: string;
  examId: string;
  title: string;
  attemptNo: number;
  status: "in_progress";
  startedAt: string;
  deadlineAt: string;
  answers: Record<string, string>;
  questions: { id: string; prompt: string; marks: number; options: { id: string; label: string }[] }[];
}

export interface SkillExamResult {
  attemptId: string;
  examId: string;
  attemptNo: number;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  passPercentage: number;
  correctCount: number;
  questionCount: number;
  completedAt: string | null;
}

export type SkillAttemptView = { state: "in_progress"; attempt: SkillAttempt } | { state: "submitted"; result: SkillExamResult };
