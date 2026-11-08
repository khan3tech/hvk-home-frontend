"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import type { SkillExamInput, SkillExamQuestionDraft, SkillExamScope, SkillExamTargets } from "@/types/api";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/portal/form-field";
import { adminSkillExamApi } from "@/lib/api/skill-exams";
import { errorMessage } from "@/lib/api/client";
import { AdminShell, StatusBadge, cardClass } from "./admin-shell";
import { QuestionEditor, cleanIds, newQuestion } from "./question-editor";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20 dark:border-white/10 dark:bg-dark-surface-alt dark:text-white";

interface Target {
  scope: SkillExamScope;
  /** Course id, or the domain name. */
  key: string;
  label: string;
}

interface Editor {
  target: Target;
  examId: string | null;
  title: string;
  description: string;
  durationMinutes: number;
  passPercentage: number;
  questions: SkillExamQuestionDraft[];
}

type ExamState = "draft" | "published" | null;

const STATE_LABEL: Record<"none" | "draft" | "published", string> = { none: "No exam yet", draft: "Draft", published: "Published" };

/** Staff portal: one exam for each course and each domain. */
export function SkillExams() {
  const [targets, setTargets] = React.useState<SkillExamTargets | null>(null);
  const [editor, setEditor] = React.useState<Editor | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [confirm, setConfirm] = React.useState<{ label: string; run: () => Promise<void> } | null>(null);

  const load = React.useCallback(() => adminSkillExamApi.targets().then(setTargets).catch((err: unknown) => setError(errorMessage(err))), []);
  React.useEffect(() => {
    void load();
  }, [load]);

  function create(target: Target) {
    setMessage(null);
    setError(null);
    setEditor({
      target,
      examId: null,
      title: `${target.label} exam`,
      description: "",
      durationMinutes: target.scope === "domain" ? 60 : 30,
      passPercentage: 40,
      questions: [newQuestion()],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function edit(target: Target, examId: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const exam = await adminSkillExamApi.get(examId);
      setEditor({ target, examId, title: exam.title, description: exam.description, durationMinutes: exam.durationMinutes, passPercentage: exam.passPercentage, questions: exam.questions });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function run(action: () => Promise<unknown>, done: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await action();
      setMessage(done);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function save(publish: boolean) {
    if (!editor) return;
    const { target } = editor;
    const input: SkillExamInput = {
      scope: target.scope,
      ...(target.scope === "course" ? { courseId: target.key } : { domain: target.key }),
      title: editor.title.trim(),
      description: editor.description.trim(),
      durationMinutes: Number(editor.durationMinutes),
      passPercentage: Number(editor.passPercentage),
      questions: cleanIds(editor.questions),
    };
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const saved = editor.examId ? await adminSkillExamApi.update(editor.examId, input) : await adminSkillExamApi.create(input);
      if (publish) await adminSkillExamApi.publish(saved.id);
      setMessage(publish ? `Published: ${saved.title}` : `Draft saved: ${saved.title}`);
      setEditor(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const rows = (items: { target: Target; examId: string | null; state: ExamState; note?: string }[]) => (
    <ul className="divide-y divide-slate-100 dark:divide-white/10">
      {items.map(({ target, examId, state, note }) => (
        <li key={`${target.scope}:${target.key}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy dark:text-white">{target.label}</p>
            {note ? <p className="text-xs text-muted dark:text-slate-400">{note}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge>{STATE_LABEL[state ?? "none"]}</StatusBadge>
            {state === null ? (
              <Button size="sm" onClick={() => create(target)} disabled={busy} aria-label={`Create exam for ${target.label}`}>
                Create exam
              </Button>
            ) : null}
            {state === "draft" && examId ? (
              <>
                <Button size="sm" variant="outline" onClick={() => void edit(target, examId)} disabled={busy} aria-label={`Edit exam for ${target.label}`}>
                  Edit
                </Button>
                <Button size="sm" onClick={() => void run(() => adminSkillExamApi.publish(examId), `Published the exam for ${target.label}.`)} disabled={busy} aria-label={`Publish exam for ${target.label}`}>
                  Publish
                </Button>
              </>
            ) : null}
            {state !== null && examId ? (
              <Button size="sm" variant="ghost" onClick={() => setConfirm({ label: target.label, run: () => run(() => adminSkillExamApi.archive(examId), `Archived the exam for ${target.label}. You can create a new one.`) })} disabled={busy} aria-label={`Archive exam for ${target.label}`}>
                Archive
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <AdminShell title="Course and domain exams">
      <p className="mb-4 max-w-3xl text-sm text-muted dark:text-slate-400">
        Each course and each domain can have one exam. Candidates with an approved payment can take them at any time, skip the videos and retake as often as they like. A draft can be edited; to change a published exam, archive it and create a new one.
      </p>
      <FormMessage>{error}</FormMessage>
      {message ? (
        <p role="status" className="mb-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          {message}
        </p>
      ) : null}

      {editor ? (
        <section className={`${cardClass} mb-6`} aria-labelledby="exam-editor-title">
          <h2 id="exam-editor-title" className="text-lg font-bold text-navy dark:text-white">
            {editor.examId ? "Edit" : "Create"} {editor.target.scope} exam: {editor.target.label}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-navy dark:text-white sm:col-span-2">
              Title
              <input className={inputClass} value={editor.title} maxLength={200} onChange={(event) => setEditor({ ...editor, title: event.target.value })} />
            </label>
            <label className="block text-sm font-semibold text-navy dark:text-white sm:col-span-2">
              Description <span className="font-normal text-muted">(optional)</span>
              <textarea className={inputClass} rows={2} maxLength={5000} value={editor.description} onChange={(event) => setEditor({ ...editor, description: event.target.value })} />
            </label>
            <label className="block text-sm font-semibold text-navy dark:text-white">
              Duration in minutes
              <input className={inputClass} type="number" min={1} max={480} value={editor.durationMinutes} onChange={(event) => setEditor({ ...editor, durationMinutes: Number(event.target.value) })} />
            </label>
            <label className="block text-sm font-semibold text-navy dark:text-white">
              Pass mark (%)
              <input className={inputClass} type="number" min={1} max={100} value={editor.passPercentage} onChange={(event) => setEditor({ ...editor, passPercentage: Number(event.target.value) })} />
            </label>
          </div>
          <div className="mt-6">
            <QuestionEditor questions={editor.questions} onChange={(questions) => setEditor({ ...editor, questions })} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => void save(false)} disabled={busy || !editor.title.trim()}>
              Save draft
            </Button>
            <Button variant="outline" onClick={() => void save(true)} disabled={busy || !editor.title.trim() || editor.questions.length === 0}>
              Save and publish
            </Button>
            <Button variant="ghost" onClick={() => setEditor(null)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </section>
      ) : null}

      {!targets ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading…
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className={cardClass} aria-labelledby="domain-exams-title">
            <h2 id="domain-exams-title" className="text-base font-bold text-navy dark:text-white">
              Domain exams
            </h2>
            <p className="mt-1 text-xs text-muted dark:text-slate-400">For a whole domain, such as Full Stack Development. A candidate can take it instead of every course exam.</p>
            <div className="mt-3">
              {targets.domains.length === 0 ? (
                <p className="text-sm text-muted">No domains yet.</p>
              ) : (
                rows(targets.domains.map((d) => ({ target: { scope: "domain" as const, key: d.name, label: d.name }, examId: d.examId, state: d.examStatus })))
              )}
            </div>
          </section>
          <section className={cardClass} aria-labelledby="course-exams-title">
            <h2 id="course-exams-title" className="text-base font-bold text-navy dark:text-white">
              Course exams
            </h2>
            <div className="mt-3">
              {targets.courses.length === 0 ? (
                <p className="text-sm text-muted">No courses yet.</p>
              ) : (
                rows(targets.courses.map((c) => ({ target: { scope: "course" as const, key: c.id, label: c.title }, examId: c.examId, state: c.examStatus, ...(c.status === "coming_soon" ? { note: "Coming soon: no videos yet" } : {}) })))
              )}
            </div>
          </section>
        </div>
      )}

      {confirm ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-5">
          <div role="alertdialog" aria-modal="true" aria-labelledby="archive-title" className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl dark:bg-dark-surface">
            <h2 id="archive-title" className="text-lg font-bold text-navy dark:text-white">
              Archive the exam for {confirm.label}?
            </h2>
            <p className="mt-2 text-sm text-muted dark:text-slate-400">Candidates will no longer see it. Their earlier attempts are kept. You can create a new exam afterwards.</p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const action = confirm;
                  setConfirm(null);
                  void action.run();
                }}
              >
                Archive
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
