"use client";

import * as React from "react";
import { Loader2, Plus, Send, Trash2 } from "lucide-react";
import { adminExamApi, type AdminExam, type AdminExamAttempt, type AdminExamDraft, type AdminExamInvitation } from "@/lib/api/admin-exams";
import { errorMessage } from "@/lib/api/client";
import { parseQuestionJson, questionJsonHint } from "@/lib/exam/question-import";
import { Button } from "@/components/ui/button";
import { AdminShell, StatusBadge, cardClass } from "./admin-shell";

type Question = AdminExamDraft["questions"][number];
type DraftForm = Omit<AdminExamDraft, "description" | "eligibleCandidateIds" | "passingMode" | "passingPercentage" | "passingMarks"> & { description: string; eligibleCandidateIdsText: string; passingMode: "PERCENTAGE" | "MARKS"; passingValue: number };

const inputClass = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20 dark:border-white/10 dark:bg-dark-surface-alt dark:text-white";
const todayIST = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function newQuestion(): Question {
  return { id: uid(), prompt: "", marks: 1, options: [{ id: uid(), label: "", isCorrect: true }, { id: uid(), label: "", isCorrect: false }] };
}

function blankDraft(): DraftForm {
  return { title: "", description: "", scheduledDate: todayIST(), durationMinutes: 30, passingMode: "PERCENTAGE", passingValue: 40, eligibilityMode: "all_registered", eligibleCandidateIdsText: "", questions: [newQuestion()] };
}

function fromDraft(draft: AdminExamDraft): DraftForm {
  return {
    title: draft.title,
    description: draft.description ?? "",
    scheduledDate: draft.scheduledDate.slice(0, 10),
    durationMinutes: draft.durationMinutes,
    passingMode: draft.passingMode === "MARKS" ? "MARKS" : "PERCENTAGE",
    passingValue: draft.passingMode === "MARKS" ? draft.passingMarks ?? 0 : draft.passingPercentage ?? 40,
    eligibilityMode: draft.eligibilityMode,
    eligibleCandidateIdsText: (draft.eligibleCandidateIds ?? []).join("\n"),
    questions: draft.questions,
  };
}

export function AdminExams() {
  const [exams, setExams] = React.useState<AdminExam[]>([]);
  const [draft, setDraft] = React.useState<DraftForm>(blankDraft);
  const [jsonImport, setJsonImport] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [attempts, setAttempts] = React.useState<Record<string, AdminExamAttempt[]>>({});
  const [invitations, setInvitations] = React.useState<Record<string, AdminExamInvitation[]>>({});
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [expandedInvitationsId, setExpandedInvitationsId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<{ label: string; run: () => Promise<void> } | null>(null);
  const cutoffEnabled = exams.some((exam) => exam.cutoffEnabled) || process.env.NEXT_PUBLIC_EXAM_CUTOFF_ENABLED === "true";
  const load = React.useCallback(() => adminExamApi.list().then(setExams).catch((err: unknown) => setError(errorMessage(err))), []);
  React.useEffect(() => { void load(); }, [load]);

  function patchQuestion(index: number, patch: Partial<Question>) {
    setDraft((current) => ({ ...current, questions: current.questions.map((question, i) => i === index ? { ...question, ...patch } : question) }));
  }

  function patchOption(questionIndex: number, optionIndex: number, patch: Partial<Question["options"][number]>) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, qi) => qi !== questionIndex ? question : {
        ...question,
        options: question.options.map((option, oi) => oi === optionIndex ? { ...option, ...patch } : option),
      }),
    }));
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) => {
        if (index !== questionIndex) return question;
        const removedWasCorrect = question.options[optionIndex]?.isCorrect;
        const options = question.options.filter((_, optionIndexValue) => optionIndexValue !== optionIndex);
        return { ...question, options: removedWasCorrect ? options.map((option, optionIndexValue) => ({ ...option, isCorrect: optionIndexValue === 0 })) : options };
      }),
    }));
  }

  function importQuestions() {
    try {
      const questions = parseQuestionJson(jsonImport) as Question[];
      setDraft((current) => ({ ...current, questions }));
      setJsonImport("");
      setMessage(`${questions.length} question${questions.length === 1 ? "" : "s"} imported. Review them before saving.`);
      setError(null);
    } catch (err) {
      setError(err instanceof SyntaxError ? "Invalid JSON. Check the commas, quotes, and brackets." : err instanceof Error ? err.message : errorMessage(err));
    }
  }

  async function saveDraft() {
    setBusy(true); setMessage(null); setError(null);
    try {
      const candidateIds = draft.eligibleCandidateIdsText.split(/[\s,]+/).map((id) => id.trim()).filter(Boolean);
      const body: AdminExamDraft = {
        title: draft.title.trim(), description: draft.description.trim(), scheduledDate: draft.scheduledDate,
        durationMinutes: Number(draft.durationMinutes), eligibilityMode: draft.eligibilityMode,
        ...(cutoffEnabled ? { passingMode: draft.passingMode, ...(draft.passingMode === "MARKS" ? { passingMarks: Number(draft.passingValue) } : { passingPercentage: Number(draft.passingValue) }) } : {}),
        ...(draft.eligibilityMode === "candidate_ids" ? { eligibleCandidateIds: candidateIds } : {}),
        questions: draft.questions,
      };
      const saved = editingId ? await adminExamApi.update(editingId, body) : await adminExamApi.create(body);
      setMessage(editingId ? `Draft updated: ${saved.title}` : `Draft created: ${saved.title}`);
      setEditingId(null); setDraft(blankDraft()); setJsonImport(""); await load();
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }

  async function editDraft(id: string) {
    setBusy(true); setError(null);
    try { setDraft(fromDraft(await adminExamApi.get(id))); setEditingId(id); window.scrollTo({ top: 0, behavior: "smooth" }); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }

  async function publish(id: string) { setBusy(true); setError(null); try { const result = await adminExamApi.publish(id); setMessage(result.linksIssued ? `Published. ${result.linksIssued} waiting paid candidates were emailed their 24-hour exam link.` : `Published. ${result.emailsQueued} invitation emails queued.`); await load(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); } }
  async function markPaid(id: string) { setBusy(true); setError(null); try { const result = await adminExamApi.setPaidExam(id); setMessage(result.status === "published" ? `Paid candidates now get this exam (24-hour link after payment). ${result.linksIssued} waiting candidates were emailed their link.` : "Paid candidates will get this exam once it is published."); await load(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); } }
  async function publishResults(id: string) { setBusy(true); setError(null); try { await adminExamApi.publishResults(id); setMessage("Results published."); await load(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); } }
  async function archive(id: string) { setBusy(true); setError(null); try { await adminExamApi.archive(id); setMessage("Examination archived."); await load(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); } }
  async function viewAttempts(id: string) { setBusy(true); setError(null); try { const result = await adminExamApi.attempts(id); setAttempts((current) => ({ ...current, [id]: result.attempts })); setExpandedId((current) => current === id ? null : id); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); } }
  async function viewInvitations(id: string) { setBusy(true); setError(null); try { const result = await adminExamApi.invitations(id); setInvitations((current) => ({ ...current, [id]: result.invitations })); setExpandedInvitationsId((current) => current === id ? null : id); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); } }

  async function confirmPendingAction() {
    const action = pendingAction;
    if (!action) return;
    setPendingAction(null);
    await action.run();
  }

  return <AdminShell title="Examinations">
    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: "Total examinations", value: exams.length },
        { label: "Published", value: exams.filter((exam) => exam.status === "published").length },
        { label: "Drafts", value: exams.filter((exam) => exam.status === "draft").length },
        { label: "Archived", value: exams.filter((exam) => exam.status === "archived").length },
      ].map((stat) => <div key={stat.label} className={cardClass}><p className="text-sm text-muted">{stat.label}</p><p className="mt-2 text-2xl font-bold text-navy dark:text-white">{stat.value}</p></div>)}
    </div>
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <section className={cardClass}>
        <h2 className="text-lg font-bold text-navy dark:text-white">{editingId ? "Edit draft examination" : "Create examination"}</h2>
        <p className="mt-1 text-sm text-muted">Set the exam schedule and eligibility, then add each question and mark one correct answer.</p>
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-semibold text-navy dark:text-white">Title<input className={inputClass} value={draft.title} maxLength={200} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></label>
          <label className="block text-sm font-semibold text-navy dark:text-white">Description<textarea className={inputClass} rows={2} maxLength={5000} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-navy dark:text-white">Exam date (IST)<input className={inputClass} type="date" value={draft.scheduledDate} onChange={(event) => setDraft((current) => ({ ...current, scheduledDate: event.target.value }))} /></label>
            <label className="block text-sm font-semibold text-navy dark:text-white">Duration in minutes<input className={inputClass} type="number" min={1} max={1440} value={draft.durationMinutes} onChange={(event) => setDraft((current) => ({ ...current, durationMinutes: Number(event.target.value) }))} /></label>
          </div>
          {cutoffEnabled ? <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold text-navy dark:text-white">Passing rule<select className={inputClass} value={draft.passingMode} onChange={(event) => setDraft((current) => ({ ...current, passingMode: event.target.value as DraftForm["passingMode"] }))}><option value="PERCENTAGE">Passing percentage</option><option value="MARKS">Passing marks</option></select></label><label className="block text-sm font-semibold text-navy dark:text-white">Required {draft.passingMode === "PERCENTAGE" ? "percentage" : "marks"}<input className={inputClass} type="number" min={0} max={draft.passingMode === "PERCENTAGE" ? 100 : undefined} step={draft.passingMode === "PERCENTAGE" ? 1 : 0.1} value={draft.passingValue} onChange={(event) => setDraft((current) => ({ ...current, passingValue: Number(event.target.value) }))} /></label></div> : null}
          <label className="block text-sm font-semibold text-navy dark:text-white">Candidate eligibility<select className={inputClass} value={draft.eligibilityMode} onChange={(event) => setDraft((current) => ({ ...current, eligibilityMode: event.target.value as DraftForm["eligibilityMode"] }))}><option value="all_registered">All registered candidates</option><option value="candidate_ids">Selected candidate IDs</option></select></label>
          {draft.eligibilityMode === "candidate_ids" ? <label className="block text-sm font-semibold text-navy dark:text-white">Candidate IDs<textarea className={`${inputClass} font-mono text-xs`} rows={3} placeholder="Paste candidate IDs, separated by spaces, commas, or new lines" value={draft.eligibleCandidateIdsText} onChange={(event) => setDraft((current) => ({ ...current, eligibleCandidateIdsText: event.target.value }))} /><span className="mt-1 block text-xs font-normal text-muted">Use registered candidate IDs. One invitation is created per eligible candidate.</span></label> : null}
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between"><h3 className="font-bold text-navy dark:text-white">Questions</h3><Button size="sm" variant="outline" onClick={() => setDraft((current) => ({ ...current, questions: [...current.questions, newQuestion()] }))}><Plus className="h-4 w-4" /> Add question</Button></div>
          <details open className="rounded-lg border border-slate-200 p-3 dark:border-white/10"><summary className="cursor-pointer text-sm font-semibold text-navy dark:text-white">Bulk import all questions from JSON</summary><label className="mt-3 block text-sm text-muted">Paste a JSON array or an object with a questions array<textarea className={`${inputClass} min-h-36 font-mono text-xs`} value={jsonImport} onChange={(event) => setJsonImport(event.target.value)} placeholder={questionJsonHint} /></label><Button className="mt-3" size="sm" variant="outline" onClick={importQuestions} disabled={!jsonImport.trim()}>Import questions</Button></details>
          {draft.questions.map((question, questionIndex) => <fieldset key={question.id} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
            <legend className="px-1 text-sm font-bold text-navy dark:text-white">Question {questionIndex + 1}</legend>
            <label className="block text-sm font-semibold text-navy dark:text-white">Question text<textarea className={inputClass} rows={3} value={question.prompt} onChange={(event) => patchQuestion(questionIndex, { prompt: event.target.value })} /></label>
            <label className="mt-3 block max-w-36 text-sm font-semibold text-navy dark:text-white">Marks<input className={inputClass} type="number" min="0.1" step="0.1" value={question.marks} onChange={(event) => patchQuestion(questionIndex, { marks: Number(event.target.value) })} /></label>
            <div className="mt-4 space-y-2"><p className="text-xs font-bold uppercase tracking-wide text-muted">Options · choose the correct answer</p>
              {question.options.map((option, optionIndex) => <div key={option.id} className="flex items-center gap-2">
                <input type="radio" name={`correct-${question.id}`} aria-label={`Mark option ${optionIndex + 1} correct`} checked={option.isCorrect} onChange={() => patchQuestion(questionIndex, { options: question.options.map((item, index) => ({ ...item, isCorrect: index === optionIndex })) })} />
                <span className="w-5 text-xs font-bold text-muted">{String.fromCharCode(65 + optionIndex)}</span>
                <input className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy dark:border-white/10 dark:bg-dark-surface-alt dark:text-white" aria-label={`Question ${questionIndex + 1} option ${optionIndex + 1}`} value={option.label} onChange={(event) => patchOption(questionIndex, optionIndex, { label: event.target.value })} />
                <button type="button" className="rounded p-2 text-muted hover:text-red-600 disabled:opacity-40" aria-label={`Remove option ${optionIndex + 1}`} disabled={question.options.length <= 2} onClick={() => removeOption(questionIndex, optionIndex)}><Trash2 className="h-4 w-4" /></button>
              </div>)}
              <Button size="sm" variant="ghost" onClick={() => patchQuestion(questionIndex, { options: [...question.options, { id: uid(), label: "", isCorrect: false }] })}><Plus className="h-4 w-4" /> Add option</Button>
            </div>
            <div className="mt-4 flex justify-end"><Button size="sm" variant="outline" disabled={draft.questions.length <= 1} onClick={() => setDraft((current) => ({ ...current, questions: current.questions.filter((_, index) => index !== questionIndex) }))}><Trash2 className="h-4 w-4" /> Remove question</Button></div>
          </fieldset>)}
        </div>
        <div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => void saveDraft()} disabled={busy || !draft.title.trim()}><Plus className="h-4 w-4" /> {editingId ? "Save draft" : "Create draft"}</Button>{editingId ? <Button variant="outline" onClick={() => { setEditingId(null); setDraft(blankDraft()); }}>Cancel edit</Button> : null}</div>
      </section>
      <section className={cardClass}>
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-navy dark:text-white">Examinations</h2><p className="mt-1 text-sm text-muted">Publish invitations, review attempts, and manage result visibility.</p></div><button type="button" onClick={() => void load()} className="text-sm font-semibold text-primary-blue">Refresh</button></div>
        <div className="mt-5 space-y-3">{exams.map((exam) => <article key={exam.id} className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-navy dark:text-white">{exam.title}</h3><p className="mt-1 text-xs text-muted">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(exam.scheduledDate))} · {exam.durationMinutes} minutes · {exam.questionCount} questions · {exam.attemptCount ?? 0} attempts</p>{exam.forPaidCandidates ? <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">For paid candidates: each gets a personal 24-hour link after payment</p> : null}</div><StatusBadge>{exam.status}</StatusBadge></div><div className="mt-3 flex flex-wrap gap-2">{exam.status !== "archived" && !exam.forPaidCandidates ? <Button size="sm" variant="outline" onClick={() => setPendingAction({ label: "Use this exam for paid candidates", run: () => markPaid(exam.id) })} disabled={busy}>Use for paid candidates</Button> : null}{exam.status === "draft" ? <><Button size="sm" variant="outline" onClick={() => void editDraft(exam.id)} disabled={busy}>Edit draft</Button><Button size="sm" onClick={() => setPendingAction({ label: "Publish examination", run: () => publish(exam.id) })} disabled={busy}><Send className="h-4 w-4" /> {exam.forPaidCandidates ? "Publish" : "Publish & email invites"}</Button></> : null}{exam.status !== "draft" ? <><Button size="sm" variant="outline" onClick={() => void viewInvitations(exam.id)} disabled={busy}>Invitation delivery</Button><Button size="sm" variant="outline" onClick={() => void viewAttempts(exam.id)} disabled={busy}>Review attempts</Button>{!exam.resultPublished ? <Button size="sm" variant="outline" onClick={() => setPendingAction({ label: "Publish results", run: () => publishResults(exam.id) })} disabled={busy}>Publish results</Button> : null}{exam.status === "published" ? <Button size="sm" variant="outline" onClick={() => setPendingAction({ label: "Archive examination", run: () => archive(exam.id) })} disabled={busy}>Archive</Button> : null}</> : null}</div>{expandedInvitationsId === exam.id ? <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-muted"><th className="p-2">Candidate</th><th className="p-2">Invitation</th><th className="p-2">Email delivery</th><th className="p-2">Started</th></tr></thead><tbody>{(invitations[exam.id] ?? []).map((invite) => <tr key={invite.candidateId} className="border-b border-slate-100 dark:border-white/10"><td className="p-2"><span className="font-semibold">{invite.candidateName ?? "Candidate"}</span><br /><span className="text-muted">{invite.candidateEmail}</span></td><td className="p-2">{invite.status}</td><td className="p-2">{invite.emailStatus}</td><td className="p-2">{invite.startedAt ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(invite.startedAt)) : "—"}</td></tr>)}</tbody></table>{!(invitations[exam.id] ?? []).length ? <p className="py-4 text-center text-xs text-muted">No candidate invitations yet.</p> : null}</div> : null}{expandedId === exam.id ? <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-muted"><th className="p-2">Candidate</th><th className="p-2">Status</th><th className="p-2">Warnings</th><th className="p-2">Score</th>{cutoffEnabled ? <th className="p-2">Qualification</th> : null}</tr></thead><tbody>{(attempts[exam.id] ?? []).map((attempt) => <tr key={attempt.attemptId} className="border-b border-slate-100 dark:border-white/10"><td className="p-2"><span className="font-semibold">{attempt.candidateName ?? "Candidate"}</span><br /><span className="text-muted">{attempt.candidateEmail ?? attempt.candidateId}</span></td><td className="p-2">{attempt.state}</td><td className="p-2">{attempt.warningCount}/5</td><td className="p-2">{attempt.score === null ? "—" : `${attempt.score}/${attempt.totalMarks}`}</td>{cutoffEnabled ? <td className="p-2">{attempt.qualification === "QUALIFIED" ? "Qualified" : attempt.qualification === "NOT_QUALIFIED" ? "Not qualified" : "Not evaluated"}</td> : null}</tr>)}</tbody></table>{!(attempts[exam.id] ?? []).length ? <p className="py-4 text-center text-xs text-muted">No candidate attempts yet.</p> : null}</div> : null}</article>)}{!exams.length ? <p className="py-8 text-center text-sm text-muted">No examinations yet.</p> : null}</div>
        {busy ? <p className="mt-4 flex items-center gap-2 text-xs text-muted"><Loader2 className="h-3 w-3 animate-spin" />Working…</p> : null}{message ? <p role="status" className="mt-4 text-sm text-emerald-700">{message}</p> : null}{error ? <p role="alert" className="mt-4 text-sm text-red-600">{error}</p> : null}
      </section>
    </div>
    {pendingAction ? <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-5"><div role="alertdialog" aria-modal="true" aria-labelledby="exam-action-title" className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl dark:bg-dark-surface"><p className="text-xs font-bold tracking-[0.15em] text-primary-blue">ADMIN ACTION</p><h2 id="exam-action-title" className="mt-2 text-2xl font-bold text-navy dark:text-white">{pendingAction.label}?</h2><p className="mt-3 text-sm leading-6 text-muted dark:text-slate-300">This action changes the examination for candidates. Please confirm to continue.</p><div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={() => setPendingAction(null)} disabled={busy}>Cancel</Button><Button onClick={() => void confirmPendingAction()} disabled={busy}>{busy ? "Working…" : "Confirm"}</Button></div></div></div> : null}
  </AdminShell>;
}
