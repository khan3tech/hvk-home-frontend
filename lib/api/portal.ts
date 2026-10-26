import type {
  Candidate,
  CreateOrderResult,
  Exam,
  OnboardingStatus,
  Payment,
  Result,
  VerifyPaymentResult,
  ManagedExamInvite,
  ManagedExamAttempt,
  ManagedExamAnswerSave,
} from "@/types/api";
import { apiFetch } from "./client";

export type ProfileUpdate = Partial<Pick<Candidate, "fullName" | "city" | "state" | "pincode" | "college" | "place">>;

export interface FeedbackPayload {
  rating: number;
  answers?: { questionId: string; answer: string }[];
  comments?: string;
}

export interface CheckoutResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** Candidate-facing endpoints (bearer token, refreshed automatically). */
export const portalApi = {
  me: () => apiFetch<Candidate>("/candidates/me"),
  updateMe: (patch: ProfileUpdate) => apiFetch<Candidate>("/candidates/me", { method: "PATCH", body: patch }),

  onboardingStatus: () => apiFetch<OnboardingStatus>("/onboarding/status"),
  completeDemo: () => apiFetch<OnboardingStatus>("/onboarding/demo/complete", { method: "POST" }),
  skipDemo: () => apiFetch<OnboardingStatus>("/onboarding/demo/skip", { method: "POST" }),

  createOrder: () => apiFetch<CreateOrderResult>("/payments/orders", { method: "POST" }),
  verifyPayment: (response: CheckoutResponse) =>
    apiFetch<VerifyPaymentResult>("/payments/verify", { method: "POST", body: response }),
  myPayments: () => apiFetch<Payment[]>("/payments/me"),

  currentExam: () => apiFetch<Exam>("/exams/current"),
  claimCompletion: (attemptId: string) =>
    apiFetch<{ status: string }>(`/exams/attempts/${encodeURIComponent(attemptId)}/complete`, { method: "POST" }),
  submitFeedback: (attemptId: string, payload: FeedbackPayload) =>
    apiFetch<{ id: string }>(`/exams/attempts/${encodeURIComponent(attemptId)}/feedback`, { method: "POST", body: payload }),

  myResult: () => apiFetch<Result | null>("/results/me"),

  managedExamInvite: (token: string) => apiFetch<ManagedExamInvite>(`/exams/invites/${encodeURIComponent(token)}`),
  managedExamInvites: () => apiFetch<ManagedExamInvite[]>("/exams/candidate-exams"),
  managedExamById: (examId: string) => apiFetch<ManagedExamInvite>(`/exams/candidate-exams/${encodeURIComponent(examId)}`),
  startManagedExam: (token: string, clientInstanceId: string) => apiFetch<ManagedExamAttempt>(`/exams/invites/${encodeURIComponent(token)}/start`, { method: "POST", headers: { "X-Exam-Client-Id": clientInstanceId } }),
  startManagedExamById: (examId: string, clientInstanceId: string) => apiFetch<ManagedExamAttempt>(`/exams/candidate-exams/${encodeURIComponent(examId)}/start`, { method: "POST", headers: { "X-Exam-Client-Id": clientInstanceId } }),
  managedExamAttempt: (attemptId: string, sessionId: string, clientInstanceId: string) => apiFetch<ManagedExamAttempt>(`/exams/attempts/${encodeURIComponent(attemptId)}`, { headers: { "X-Exam-Session": sessionId, "X-Exam-Client-Id": clientInstanceId } }),
  saveManagedExamAnswer: (attemptId: string, questionId: string, selectedOptionId: string, sessionId: string, clientInstanceId: string, clientRevision: number, idempotencyKey?: string) => apiFetch<ManagedExamAnswerSave>(`/exams/attempts/${encodeURIComponent(attemptId)}/answers/${encodeURIComponent(questionId)}`, { method: "PUT", headers: { "X-Exam-Session": sessionId, "X-Exam-Client-Id": clientInstanceId, ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) }, body: { selectedOptionId, clientRevision } }),
  submitManagedExam: (attemptId: string, sessionId: string, clientInstanceId: string, idempotencyKey?: string) => apiFetch<ManagedExamAttempt>(`/exams/attempts/${encodeURIComponent(attemptId)}/submit`, { method: "POST", headers: { "X-Exam-Session": sessionId, "X-Exam-Client-Id": clientInstanceId, ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) } }),
  recordManagedExamMonitoring: (attemptId: string, type: "MULTIPLE_FACE" | "NO_FACE" | "CAMERA_LOST" | "TAB_HIDDEN" | "FULLSCREEN_EXIT", sessionId: string, clientInstanceId: string, idempotencyKey?: string) => apiFetch<{ warningCount: number; state: string }>(`/exams/attempts/${encodeURIComponent(attemptId)}/monitoring-events`, { method: "POST", headers: { "X-Exam-Session": sessionId, "X-Exam-Client-Id": clientInstanceId, ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) }, body: { type } }),
};
