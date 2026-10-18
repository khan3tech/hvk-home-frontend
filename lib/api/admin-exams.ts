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

export const adminExamApi = {
  list: () => apiFetch<AdminExam[]>("/admin/exams"),
  create: (body: unknown) => apiFetch<AdminExam>("/admin/exams", { method: "POST", body }),
  publish: (id: string) => apiFetch<{ examId: string; status: string; invitationsCreated: number; emailsQueued: number }>(`/admin/exams/${encodeURIComponent(id)}/publish`, { method: "POST" }),
  publishResults: (id: string) => apiFetch<{ examId: string; resultPublished: boolean }>(`/admin/exams/${encodeURIComponent(id)}/results/publish`, { method: "POST" }),
};
