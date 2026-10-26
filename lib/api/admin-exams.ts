import type { Exam } from "@/types/api";
import { apiFetch } from "./client";

export interface AdminExam {
  id: string;
  title: string;
  description: string;
  scheduledDate: string;
  durationMinutes: number;
  status: "draft" | "published" | "archived";
  questionCount: number;
  resultPublished: boolean;
  /** The exam paid candidates get a personal 24-hour link to (only one at a time). */
  forPaidCandidates?: boolean;
  attemptCount?: number;
  cutoffEnabled: boolean;
  passingMode?: "NONE" | "PERCENTAGE" | "MARKS";
  passingPercentage?: number;
  passingMarks?: number | null;
}

export interface AdminExamDraft {
  title: string;
  description?: string;
  scheduledDate: string;
  durationMinutes: number;
  passingMode?: "PERCENTAGE" | "MARKS";
  passingPercentage?: number;
  passingMarks?: number | null;
  eligibilityMode: "all_registered" | "candidate_ids";
  eligibleCandidateIds?: string[];
  questions: Array<{ id: string; prompt: string; marks: number; options: Array<{ id: string; label: string; isCorrect: boolean }> }>;
}

export interface AdminExamAttempt {
  attemptId: string;
  candidateId: string;
  candidateName: string | null;
  candidateEmail: string | null;
  state: "in_progress" | "submitted" | "expired";
  startedAt: string;
  deadlineAt: string;
  finalizedAt: string | null;
  finalizationReason: string | null;
  warningCount: number;
  score: number | null;
  totalMarks: number | null;
  qualification: "QUALIFIED" | "NOT_QUALIFIED" | "NOT_EVALUATED" | null;
  published: boolean;
}

export interface AdminExamInvitation {
  candidateId: string;
  candidateName: string | null;
  candidateEmail: string;
  status: "invited" | "started" | "submitted" | "expired" | "revoked";
  emailStatus: "queued" | "sent" | "failed" | "not_queued";
  createdAt: string;
  startedAt: string | null;
  submittedAt: string | null;
}

export const adminExamApi = {
  list: () => apiFetch<AdminExam[]>("/admin/exams"),
  get: (id: string) => apiFetch<AdminExamDraft>(`/admin/exams/${encodeURIComponent(id)}`),
  create: (body: AdminExamDraft) => apiFetch<AdminExam>("/admin/exams", { method: "POST", body }),
  update: (id: string, body: AdminExamDraft) => apiFetch<AdminExam>(`/admin/exams/${encodeURIComponent(id)}`, { method: "PUT", body }),
  archive: (id: string) => apiFetch<AdminExam>(`/admin/exams/${encodeURIComponent(id)}/archive`, { method: "POST" }),
  attempts: (id: string) => apiFetch<{ examId: string; resultPublished: boolean; attempts: AdminExamAttempt[] }>(`/admin/exams/${encodeURIComponent(id)}/attempts`),
  invitations: (id: string) => apiFetch<{ examId: string; invitations: AdminExamInvitation[] }>(`/admin/exams/${encodeURIComponent(id)}/invitations`),
  publish: (id: string) => apiFetch<{ examId: string; status: string; invitationsCreated: number; emailsQueued: number; linksIssued?: number }>(`/admin/exams/${encodeURIComponent(id)}/publish`, { method: "POST" }),
  /** Marks the exam paid candidates get; candidates who were waiting receive their link now. */
  setPaidExam: (id: string) => apiFetch<AdminExam & { linksIssued: number }>(`/admin/exams/${encodeURIComponent(id)}/paid-exam`, { method: "POST" }),
  /** Sends a paid candidate a fresh 24-hour exam link (their previous link stops working). */
  reissueLink: (candidateId: string) => apiFetch<Exam>(`/admin/exams/candidates/${encodeURIComponent(candidateId)}/reissue-link`, { method: "POST" }),
  publishResults: (id: string) => apiFetch<{ examId: string; resultPublished: boolean }>(`/admin/exams/${encodeURIComponent(id)}/results/publish`, { method: "POST" }),
};
