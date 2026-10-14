import type {
  Candidate,
  CreateOrderResult,
  Exam,
  OnboardingStatus,
  Payment,
  Result,
  VerifyPaymentResult,
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
};
