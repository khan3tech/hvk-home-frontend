"use client";

import * as React from "react";
import { Loader2, Plus, Send } from "lucide-react";
import { adminExamApi, type AdminExam, type AdminExamAttempt } from "@/lib/api/admin-exams";
import { errorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { AdminShell, StatusBadge, cardClass } from "./admin-shell";

const sample = JSON.stringify({ title: "Sample examination", description: "Short description", scheduledDate: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }), durationMinutes: 30, eligibilityMode: "all_registered", questions: [{ id: "q1", prompt: "What is 2 + 2?", marks: 1, options: [{ id: "a", label: "3", isCorrect: false }, { id: "b", label: "4", isCorrect: true }] }] }, null, 2);

export function AdminExams() {
  const [exams, setExams] = React.useState<AdminExam[]>([]);
  const [json, setJson] = React.useState(sample);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [attempts, setAttempts] = React.useState<Record<string, AdminExamAttempt[]>>({});
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const load = React.useCallback(() => adminExamApi.list().then(setExams).catch((err: unknown) => setError(errorMessage(err))), []);
  React.useEffect(() => { void load(); }, [load]);

  async function saveDraft() {
    setBusy(true); setMessage(null); setError(null);
    try {
      const body = JSON.parse(json) as Parameters<typeof adminExamApi.create>[0];
      const saved = editingId ? await adminExamApi.update(editingId, body) : await adminExamApi.create(body);
      setMessage(editingId ? `Draft updated: ${saved.title}` : `Draft created: ${saved.title}`);
      setEditingId(null); setJson(sample); await load();
    } catch (err) { setError(err instanceof SyntaxError ? "The JSON format is invalid." : errorMessage(err)); }
    finally { setBusy(false); }
  }
  async function editDraft(id: string) {
    setBusy(true); setError(null);
    try { setJson(JSON.stringify(await adminExamApi.get(id), null, 2)); setEditingId(id); window.scrollTo({ top: 0, behavior: "smooth" }); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function publish(id: string) { setBusy(true); setError(null); try { const result = await adminExamApi.publish(id); setMessage(`Published. ${result.emailsQueued} invitation emails queued.`); await load(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); } }
  async function publishResults(id: string) { setBusy(true); setError(null); try { await adminExamApi.publishResults(id); setMessage("Results published."); await load(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); } }
  async function archive(id: string) { setBusy(true); setError(null); try { await adminExamApi.archive(id); setMessage("Examination archived."); await load(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); } }
  async function viewAttempts(id: string) { setBusy(true); setError(null); try { const result = await adminExamApi.attempts(id); setAttempts((current) => ({ ...current, [id]: result.attempts })); setExpandedId((current) => current === id ? null : id); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); } }

  return <AdminShell title="Examinations">
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <section className={cardClass}>
        <h2 className="text-lg font-bold text-navy dark:text-white">{editingId ? "Edit draft examination" : "Create examination"}</h2>
        <p className="mt-1 text-sm text-muted">Use the JSON editor to set eligibility and define each question with exactly one correct answer.</p>
        <textarea value={json} onChange={(event) => setJson(event.target.value)} className="mt-4 min-h-[360px] w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs dark:border-white/10 dark:bg-dark-surface-alt dark:text-slate-200" aria-label="Exam JSON" />
        <div className="mt-4 flex gap-2"><Button onClick={() => void saveDraft()} disabled={busy}><Plus className="h-4 w-4" /> {editingId ? "Save draft" : "Create draft"}</Button>{editingId ? <Button variant="outline" onClick={() => { setEditingId(null); setJson(sample); }}>Cancel edit</Button> : null}</div>
      </section>
      <section className={cardClass}>
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-navy dark:text-white">Examinations</h2><p className="mt-1 text-sm text-muted">Publish invitations, review attempts, and manage result visibility.</p></div><button type="button" onClick={() => void load()} className="text-sm font-semibold text-primary-blue">Refresh</button></div>
        <div className="mt-5 space-y-3">{exams.map((exam) => <article key={exam.id} className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-navy dark:text-white">{exam.title}</h3><p className="mt-1 text-xs text-muted">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(exam.scheduledDate))} · {exam.durationMinutes} minutes · {exam.questionCount} questions</p></div><StatusBadge>{exam.status}</StatusBadge></div><div className="mt-3 flex flex-wrap gap-2">{exam.status === "draft" ? <><Button size="sm" variant="outline" onClick={() => void editDraft(exam.id)} disabled={busy}>Edit draft</Button><Button size="sm" onClick={() => void publish(exam.id)} disabled={busy}><Send className="h-4 w-4" /> Publish & email invites</Button></> : null}{exam.status !== "draft" ? <><Button size="sm" variant="outline" onClick={() => void viewAttempts(exam.id)} disabled={busy}>Review attempts</Button>{!exam.resultPublished ? <Button size="sm" variant="outline" onClick={() => void publishResults(exam.id)} disabled={busy}>Publish results</Button> : null}{exam.status === "published" ? <Button size="sm" variant="outline" onClick={() => void archive(exam.id)} disabled={busy}>Archive</Button> : null}</> : null}</div>{expandedId === exam.id ? <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-muted"><th className="p-2">Candidate</th><th className="p-2">Status</th><th className="p-2">Warnings</th><th className="p-2">Score</th></tr></thead><tbody>{(attempts[exam.id] ?? []).map((attempt) => <tr key={attempt.attemptId} className="border-b border-slate-100 dark:border-white/10"><td className="p-2"><span className="font-semibold">{attempt.candidateName ?? "Candidate"}</span><br /><span className="text-muted">{attempt.candidateEmail ?? attempt.candidateId}</span></td><td className="p-2">{attempt.state}</td><td className="p-2">{attempt.warningCount}/5</td><td className="p-2">{attempt.score === null ? "—" : `${attempt.score}/${attempt.totalMarks}`}</td></tr>)}</tbody></table>{!(attempts[exam.id] ?? []).length ? <p className="py-4 text-center text-xs text-muted">No candidate attempts yet.</p> : null}</div> : null}</article>)}{!exams.length ? <p className="py-8 text-center text-sm text-muted">No examinations yet.</p> : null}</div>
        {busy ? <p className="mt-4 flex items-center gap-2 text-xs text-muted"><Loader2 className="h-3 w-3 animate-spin" />Working…</p> : null}{message ? <p role="status" className="mt-4 text-sm text-emerald-700">{message}</p> : null}{error ? <p role="alert" className="mt-4 text-sm text-red-600">{error}</p> : null}
      </section>
    </div>
  </AdminShell>;
}
