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
}

export interface AdminExamDraft {
  title: string;
  description?: string;
  scheduledDate: string;
  durationMinutes: number;
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
}

export const adminExamApi = {
  list: () => apiFetch<AdminExam[]>("/admin/exams"),
  get: (id: string) => apiFetch<AdminExamDraft>(`/admin/exams/${encodeURIComponent(id)}`),
  create: (body: AdminExamDraft) => apiFetch<AdminExam>("/admin/exams", { method: "POST", body }),
  update: (id: string, body: AdminExamDraft) => apiFetch<AdminExam>(`/admin/exams/${encodeURIComponent(id)}`, { method: "PUT", body }),
  archive: (id: string) => apiFetch<AdminExam>(`/admin/exams/${encodeURIComponent(id)}/archive`, { method: "POST" }),
  attempts: (id: string) => apiFetch<{ examId: string; resultPublished: boolean; attempts: AdminExamAttempt[] }>(`/admin/exams/${encodeURIComponent(id)}/attempts`),
  publish: (id: string) => apiFetch<{ examId: string; status: string; invitationsCreated: number; emailsQueued: number }>(`/admin/exams/${encodeURIComponent(id)}/publish`, { method: "POST" }),
  publishResults: (id: string) => apiFetch<{ examId: string; resultPublished: boolean }>(`/admin/exams/${encodeURIComponent(id)}/results/publish`, { method: "POST" }),
};
