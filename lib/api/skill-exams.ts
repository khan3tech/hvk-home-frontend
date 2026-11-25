import type {
  MySkillAttempt,
  Page,
  SkillAttempt,
  SkillExamAttemptAdmin,
  SkillTerminationReason,
  SkillAttemptView,
  SkillExam,
  SkillExamAdmin,
  SkillExamAdminDetail,
  SkillExamInput,
  SkillExamResult,
  SkillExamTargets,
} from "@/types/api";
import { apiFetch } from "./client";

const enc = encodeURIComponent;

/** Candidate side of the course and domain exams (spec 007). */
export const skillExamApi = {
  list: () => apiFetch<SkillExam[]>("/skill-exams"),
  /** Exams this candidate has taken, newest first. */
  mine: () => apiFetch<MySkillAttempt[]>("/skill-exam-attempts"),
  start: (examId: string) => apiFetch<SkillAttempt>(`/skill-exams/${enc(examId)}/start`, { method: "POST" }),
  attempt: (attemptId: string) => apiFetch<SkillAttemptView>(`/skill-exam-attempts/${enc(attemptId)}`),
  answer: (attemptId: string, questionId: string, selectedOptionId: string, sessionKey: string) =>
    apiFetch<{ questionId: string; selectedOptionId: string }>(`/skill-exam-attempts/${enc(attemptId)}/answers/${enc(questionId)}`, {
      method: "PUT",
      body: { selectedOptionId },
      headers: { "X-Exam-Session": sessionKey },
    }),
  submit: (attemptId: string, sessionKey: string) =>
    apiFetch<SkillExamResult>(`/skill-exam-attempts/${enc(attemptId)}/submit`, { method: "POST", headers: { "X-Exam-Session": sessionKey } }),
  /** "Still here", every 30 seconds; an exam silent for 5 minutes is ended by the server. */
  heartbeat: (attemptId: string, sessionKey: string) =>
    apiFetch<{ deadlineAt: string }>(`/skill-exam-attempts/${enc(attemptId)}/heartbeat`, { method: "POST", headers: { "X-Exam-Session": sessionKey } }),
  /** The exam window reports that the candidate left; keepalive lets it reach the API while the page closes. */
  terminate: (attemptId: string, reason: SkillTerminationReason) =>
    apiFetch<SkillExamResult>(`/skill-exam-attempts/${enc(attemptId)}/terminate`, { method: "POST", body: { reason }, keepalive: true }),
  feedback: (attemptId: string, rating: number, comments: string) =>
    apiFetch<SkillExamResult>(`/skill-exam-attempts/${enc(attemptId)}/feedback`, { method: "POST", body: { rating, comments: comments || undefined } }),
};

/** Staff side (role ta or admin). */
export const adminSkillExamApi = {
  targets: () => apiFetch<SkillExamTargets>("/admin/skill-exams/targets"),
  attempts: (q: { status?: string; q?: string; page?: number; limit?: number }) =>
    apiFetch<Page<SkillExamAttemptAdmin>>("/admin/skill-exam-attempts", { query: { ...q } }),
  allowNewAttempt: (attemptId: string) =>
    apiFetch<{ id: string; releasedAt: string | null }>(`/admin/skill-exam-attempts/${enc(attemptId)}/allow-new-attempt`, { method: "POST" }),
  list: () => apiFetch<SkillExamAdmin[]>("/admin/skill-exams"),
  get: (id: string) => apiFetch<SkillExamAdminDetail>(`/admin/skill-exams/${enc(id)}`),
  create: (input: SkillExamInput) => apiFetch<SkillExamAdminDetail>("/admin/skill-exams", { method: "POST", body: input }),
  update: (id: string, input: SkillExamInput) => apiFetch<SkillExamAdminDetail>(`/admin/skill-exams/${enc(id)}`, { method: "PUT", body: input }),
  publish: (id: string) => apiFetch<SkillExamAdminDetail>(`/admin/skill-exams/${enc(id)}/publish`, { method: "POST" }),
  archive: (id: string) => apiFetch<SkillExamAdminDetail>(`/admin/skill-exams/${enc(id)}/archive`, { method: "POST" }),
};
