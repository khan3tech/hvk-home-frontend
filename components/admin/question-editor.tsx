"use client";

import * as React from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import type { SkillExamQuestionDraft } from "@/types/api";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/client";
import { parseQuestionJson, questionJsonHint } from "@/lib/exam/question-import";
import { QUESTION_FILE_ACCEPT, questionsFromFile } from "@/lib/exam/question-file";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20 dark:border-white/10 dark:bg-dark-surface-alt dark:text-white";

const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function newQuestion(): SkillExamQuestionDraft {
  return { id: uid(), prompt: "", marks: 1, options: [{ id: uid(), label: "", isCorrect: true }, { id: uid(), label: "", isCorrect: false }] };
}

/** Ids may only use letters, digits, "-" and "_" (the API rule); imported ids with other characters are cleaned. */
export function cleanIds(questions: SkillExamQuestionDraft[]): SkillExamQuestionDraft[] {
  const clean = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 100) || uid();
  return questions.map((q) => ({ ...q, id: clean(q.id), options: q.options.map((o) => ({ ...o, id: clean(o.id) })) }));
}

const fileHint = 'PDF/TXT layout: "1. Question", options "A." to "D.", then "Correct answer: A". Replaces the questions below.';

/** Edits a list of single-answer questions: write them one by one, or import a PDF, TXT or JSON file. */
export function QuestionEditor({ questions, onChange }: { questions: SkillExamQuestionDraft[]; onChange: (questions: SkillExamQuestionDraft[]) => void }) {
  const [json, setJson] = React.useState("");
  const [note, setNote] = React.useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);

  const patch = (index: number, next: Partial<SkillExamQuestionDraft>) => onChange(questions.map((q, i) => (i === index ? { ...q, ...next } : q)));
  const patchOption = (qi: number, oi: number, next: Partial<SkillExamQuestionDraft["options"][number]>) =>
    patch(qi, { options: questions[qi]!.options.map((o, i) => (i === oi ? { ...o, ...next } : o)) });
  const setCorrect = (qi: number, oi: number) => patch(qi, { options: questions[qi]!.options.map((o, i) => ({ ...o, isCorrect: i === oi })) });
  const removeOption = (qi: number, oi: number) => {
    const q = questions[qi]!;
    const options = q.options.filter((_, i) => i !== oi);
    patch(qi, { options: q.options[oi]?.isCorrect ? options.map((o, i) => ({ ...o, isCorrect: i === 0 })) : options });
  };

  function importJson() {
    try {
      const imported = parseQuestionJson(json) as SkillExamQuestionDraft[];
      onChange(imported);
      setJson("");
      setNote({ tone: "ok", text: `${imported.length} question${imported.length === 1 ? "" : "s"} imported. Review them before saving.` });
    } catch (err) {
      setNote({ tone: "error", text: err instanceof SyntaxError ? "Invalid JSON. Check the commas, quotes and brackets." : errorMessage(err) });
    }
  }

  async function importFile(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    setNote(null);
    setBusy(true);
    try {
      const imported = (await questionsFromFile(file)) as SkillExamQuestionDraft[];
      onChange(imported);
      setNote({ tone: "ok", text: `${imported.length} question${imported.length === 1 ? "" : "s"} imported from ${file.name}. Review them before saving.` });
    } catch (err) {
      setNote({ tone: "error", text: err instanceof Error ? err.message : errorMessage(err) });
    } finally {
      setBusy(false);
      input.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-navy dark:text-white">Questions ({questions.length})</h3>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...questions, newQuestion()])}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add question
        </Button>
      </div>

      <details className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
        <summary className="cursor-pointer text-sm font-semibold text-navy dark:text-white">Bulk import (PDF, TXT or JSON)</summary>
        <div className="mt-3 space-y-3">
          <label className="block text-sm font-semibold text-navy dark:text-white">
            <span className="inline-flex items-center gap-2">
              <Upload className="h-4 w-4" aria-hidden="true" /> Choose a file
            </span>
            <input type="file" accept={QUESTION_FILE_ACCEPT} className="mt-1 block w-full text-sm" onChange={(event) => void importFile(event)} disabled={busy} />
            <span className="mt-1 block text-xs font-normal text-muted">{fileHint}</span>
          </label>
          <label className="block text-sm font-semibold text-navy dark:text-white">
            Or paste JSON
            <textarea className={`${inputClass} font-mono text-xs`} rows={4} value={json} placeholder={questionJsonHint} onChange={(event) => setJson(event.target.value)} />
          </label>
          <Button type="button" size="sm" variant="outline" onClick={importJson} disabled={!json.trim()}>
            Import JSON
          </Button>
        </div>
      </details>
      {note ? (
        <p role={note.tone === "error" ? "alert" : "status"} className={`text-sm font-medium ${note.tone === "error" ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
          {note.text}
        </p>
      ) : null}

      {questions.map((question, qi) => (
        <fieldset key={question.id} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
          <legend className="px-1 text-sm font-bold text-navy dark:text-white">Question {qi + 1}</legend>
          <label className="block text-sm font-semibold text-navy dark:text-white">
            Question text
            <textarea className={inputClass} rows={2} value={question.prompt} onChange={(event) => patch(qi, { prompt: event.target.value })} />
          </label>
          <label className="mt-3 block max-w-32 text-sm font-semibold text-navy dark:text-white">
            Marks
            <input className={inputClass} type="number" min="0.1" step="0.1" value={question.marks} onChange={(event) => patch(qi, { marks: Number(event.target.value) })} />
          </label>
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Options · choose the correct answer</p>
            {question.options.map((option, oi) => (
              <div key={option.id} className="flex items-center gap-2">
                <input type="radio" name={`correct-${question.id}`} aria-label={`Mark option ${oi + 1} of question ${qi + 1} correct`} checked={option.isCorrect} onChange={() => setCorrect(qi, oi)} />
                <span className="w-5 text-xs font-bold text-muted">{String.fromCharCode(65 + oi)}</span>
                <input
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy dark:border-white/10 dark:bg-dark-surface-alt dark:text-white"
                  aria-label={`Question ${qi + 1} option ${oi + 1}`}
                  value={option.label}
                  onChange={(event) => patchOption(qi, oi, { label: event.target.value })}
                />
                <button type="button" className="rounded p-2 text-muted hover:text-red-600 disabled:opacity-40" aria-label={`Remove option ${oi + 1} of question ${qi + 1}`} disabled={question.options.length <= 2} onClick={() => removeOption(qi, oi)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
            <Button type="button" size="sm" variant="ghost" disabled={question.options.length >= 10} onClick={() => patch(qi, { options: [...question.options, { id: uid(), label: "", isCorrect: false }] })}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add option
            </Button>
          </div>
          <div className="mt-3 flex justify-end">
            <Button type="button" size="sm" variant="outline" onClick={() => onChange(questions.filter((_, i) => i !== qi))}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove question
            </Button>
          </div>
        </fieldset>
      ))}
    </div>
  );
}
