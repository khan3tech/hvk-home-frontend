import type {
  SkillAttempt,
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
  start: (examId: string) => apiFetch<SkillAttempt>(`/skill-exams/${enc(examId)}/start`, { method: "POST" }),
  attempt: (attemptId: string) => apiFetch<SkillAttemptView>(`/skill-exam-attempts/${enc(attemptId)}`),
  answer: (attemptId: string, questionId: string, selectedOptionId: string) =>
    apiFetch<{ questionId: string; selectedOptionId: string }>(`/skill-exam-attempts/${enc(attemptId)}/answers/${enc(questionId)}`, { method: "PUT", body: { selectedOptionId } }),
  submit: (attemptId: string) => apiFetch<SkillExamResult>(`/skill-exam-attempts/${enc(attemptId)}/submit`, { method: "POST" }),
};

/** Staff side (role ta or admin). */
export const adminSkillExamApi = {
  targets: () => apiFetch<SkillExamTargets>("/admin/skill-exams/targets"),
  list: () => apiFetch<SkillExamAdmin[]>("/admin/skill-exams"),
  get: (id: string) => apiFetch<SkillExamAdminDetail>(`/admin/skill-exams/${enc(id)}`),
  create: (input: SkillExamInput) => apiFetch<SkillExamAdminDetail>("/admin/skill-exams", { method: "POST", body: input }),
  update: (id: string, input: SkillExamInput) => apiFetch<SkillExamAdminDetail>(`/admin/skill-exams/${enc(id)}`, { method: "PUT", body: input }),
  publish: (id: string) => apiFetch<SkillExamAdminDetail>(`/admin/skill-exams/${enc(id)}/publish`, { method: "POST" }),
  archive: (id: string) => apiFetch<SkillExamAdminDetail>(`/admin/skill-exams/${enc(id)}/archive`, { method: "POST" }),
};
