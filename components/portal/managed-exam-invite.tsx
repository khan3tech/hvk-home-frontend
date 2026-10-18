"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Clock3, Loader2, ShieldCheck } from "lucide-react";
import { ApiError, errorMessage } from "@/lib/api/client";
import { portalApi } from "@/lib/api/portal";
import type { ManagedExamAttempt, ManagedExamInvite } from "@/types/api";
import { Button } from "@/components/ui/button";
import { monitoringSignal } from "@/lib/exam/monitoring";
import { exitExamFullscreen } from "@/lib/exam/fullscreen";

function clientIdFor(token: string): string {
  const key = `hvk-exam-client:${token}`;
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const value = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(key, value);
  return value;
}

function formatTime(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function ManagedExamInvite() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [invite, setInvite] = React.useState<ManagedExamInvite | null>(null);
  const [attempt, setAttempt] = React.useState<ManagedExamAttempt | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [activeConflict, setActiveConflict] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [starting, setStarting] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmSubmit, setConfirmSubmit] = React.useState(false);
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const [cameraReady, setCameraReady] = React.useState(false);
  const [cameraMessage, setCameraMessage] = React.useState("Camera permission is required before starting.");
  const [monitoringDialog, setMonitoringDialog] = React.useState<"NO_FACE" | "MULTIPLE_FACE" | null>(null);
  const sessionId = attempt?.sessionId ?? null;
  const attemptId = attempt?.id ?? null;
  const attemptState = attempt?.state ?? null;
  const deadlineAt = attempt?.deadlineAt ?? null;
  const clientInstanceId = React.useMemo(() => (typeof window === "undefined" ? "" : clientIdFor(token)), [token]);
  const onCameraReady = React.useCallback(() => setCameraReady(true), []);
  const onCameraMessage = React.useCallback((message: string) => setCameraMessage(message), []);
  const onCameraWarning = React.useCallback((type: "NO_FACE" | "MULTIPLE_FACE" | "CAMERA_LOST") => {
    if (type !== "CAMERA_LOST") setMonitoringDialog(type);
    if (!attempt || !sessionId) return;
    void portalApi.recordManagedExamMonitoring(attempt.id, type, sessionId, clientInstanceId)
      .then((result) => setAttempt((current) => current ? { ...current, warningCount: result.warningCount } : current))
      .catch(() => undefined);
  }, [attempt, clientInstanceId, sessionId]);

  React.useEffect(() => {
    let cancelled = false;
    portalApi.managedExamInvite(token).then((data) => { if (!cancelled) setInvite(data); }).catch((err: unknown) => { if (!cancelled) setError(errorMessage(err)); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  React.useEffect(() => {
    if (!deadlineAt || attemptState !== "in_progress") return;
    const tick = () => setRemaining(Math.max(0, Date.parse(deadlineAt) - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = "Your examination is still in progress."; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => { window.clearInterval(id); window.removeEventListener("beforeunload", beforeUnload); };
  }, [attemptState, deadlineAt]);

  React.useEffect(() => {
    if (!attemptId || attemptState !== "in_progress" || !sessionId) return;
    const record = (type: "TAB_HIDDEN" | "FULLSCREEN_EXIT") => { void portalApi.recordManagedExamMonitoring(attemptId, type, sessionId, clientInstanceId).then((result) => setAttempt((current) => current ? { ...current, warningCount: result.warningCount } : current)).catch(() => undefined); };
    const onVisibility = () => { if (document.visibilityState === "hidden") record("TAB_HIDDEN"); };
    const onFullscreen = () => { if (!document.fullscreenElement) record("FULLSCREEN_EXIT"); };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => { document.removeEventListener("visibilitychange", onVisibility); document.removeEventListener("fullscreenchange", onFullscreen); };
  }, [attemptId, attemptState, clientInstanceId, sessionId]);

  React.useEffect(() => {
    if (!attemptId || attemptState !== "in_progress") return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let video: HTMLVideoElement | null = null;
    let lastSignal: { type: string | null; at: number } = { type: null, at: 0 };
    async function monitor() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        if (cancelled) return stream.getTracks().forEach((track) => track.stop());
        video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;
        await video.play();
        const tf = await import("@tensorflow/tfjs-core");
        await import("@tensorflow/tfjs-backend-webgl");
        await import("@tensorflow/tfjs-backend-cpu");
        await tf.setBackend("webgl").catch(() => tf.setBackend("cpu"));
        await tf.ready();
        const { load } = await import("@tensorflow-models/blazeface");
        const detector = await load();
        if (cancelled) return;
        timer = window.setInterval(async () => {
          if (cancelled || !video || video.readyState < 2 || !video.videoWidth) return;
          try {
            const signal = monitoringSignal(await detector.estimateFaces(video, false));
            if (!signal) return;
            const now = Date.now();
            if (lastSignal.type === signal && now - lastSignal.at < 5000) return;
            lastSignal = { type: signal, at: now };
            onCameraWarning(signal);
          } catch { /* Ignore a failed local sample and continue monitoring. */ }
        }, 3000);
      } catch { /* CameraGate already displays the permission/retry state. */ }
    }
    void monitor();
    return () => { cancelled = true; if (timer) window.clearInterval(timer); stream?.getTracks().forEach((track) => track.stop()); video = null; };
  }, [attemptId, attemptState, onCameraWarning]);

  async function start() {
    setError(null); setStarting(true);
    try {
      if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen().catch(() => undefined);
      const next = await portalApi.startManagedExam(token, clientInstanceId);
      setAttempt(next);
      setInvite((current) => current ? { ...current, inviteStatus: "started" } : current);
    } catch (err) {
      if (err instanceof ApiError && err.code === "ACTIVE_SESSION_EXISTS") setActiveConflict(true);
      else setError(errorMessage(err));
    } finally { setStarting(false); }
  }

  async function choose(questionId: string, optionId: string) {
    if (!attempt || !sessionId || attempt.state !== "in_progress") return;
    setAttempt((current) => current ? { ...current, answers: { ...current.answers, [questionId]: optionId } } : current);
    try {
      const saved = await portalApi.saveManagedExamAnswer(attempt.id, questionId, optionId, sessionId, clientInstanceId, attempt.version);
      setAttempt((current) => current ? { ...current, version: saved.serverRevision } : current);
    } catch (err) { setError(errorMessage(err)); }
  }

  async function submit() {
    if (!attempt || !sessionId) return;
    setSubmitting(true);
    try { const submitted = await portalApi.submitManagedExam(attempt.id, sessionId, clientInstanceId); await exitExamFullscreen(); setAttempt(submitted); setConfirmSubmit(false); }
    catch (err) { setError(errorMessage(err)); }
    finally { setSubmitting(false); }
  }

  if (loading) return <ExamFrame><Loading /></ExamFrame>;
  if (error && !invite) return <ExamFrame><Message title="Unable to open examination" text={error} /></ExamFrame>;
  if (!invite) return null;
  if (activeConflict) return <ExamFrame><Message title="Examination already open" text="This examination is already open in another tab or device. Return to the original examination window to continue." /></ExamFrame>;
  if (!attempt) return <ExamFrame><div className="mx-auto max-w-2xl space-y-6"><div><p className="text-xs font-bold tracking-[0.18em] text-primary-blue">EXAMINATION INVITATION</p><h1 className="mt-2 text-3xl font-bold text-navy dark:text-white">{invite.title}</h1><p className="mt-3 text-muted dark:text-slate-300">{invite.description || "Complete this examination in one focused session."}</p></div><div className="grid gap-3 sm:grid-cols-3"><Info icon={<Clock3 className="h-4 w-4" />} label="Duration" value={`${invite.durationMinutes} minutes`} /><Info icon={<ShieldCheck className="h-4 w-4" />} label="Security" value="Camera and fullscreen" /><Info icon={<CheckCircle2 className="h-4 w-4" />} label="Questions" value={String(invite.questionCount)} /></div><div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-muted shadow-sm dark:border-white/10 dark:bg-dark-surface-alt dark:text-slate-300">Your answers are saved as you go. Only manual submission finalizes the examination. Do not close this window while the attempt is active.</div><CameraGate onReady={onCameraReady} onMessage={onCameraMessage} onWarning={onCameraWarning} /><p className="text-sm text-muted">{cameraMessage}</p><Button size="lg" onClick={() => void start()} disabled={starting || !cameraReady}>{starting ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting…</> : "Start examination"}</Button>{error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}</div></ExamFrame>;

  if (attempt.state !== "in_progress") return <ExamFrame><Message title={attempt.state === "expired" ? "Time expired" : "Submission received"} text={attempt.state === "expired" ? "The deadline ended before manual submission. No result was created." : "Your examination was submitted. The result will appear after administrator publication."} /></ExamFrame>;
  const question = attempt.questions[questionIndex];
  if (!question) return <ExamFrame><Message title="No questions available" text="The examination question set could not be loaded." /></ExamFrame>;
  return <ExamFrame><div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[220px_1fr]"><aside className="space-y-4"><div className="rounded-2xl bg-navy p-5 text-white"><p className="text-xs font-bold tracking-[0.15em] text-slate-300">TIME REMAINING</p><p className="mt-2 text-3xl font-bold">{formatTime(remaining ?? 0)}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-dark-surface-alt"><p className="text-sm font-semibold text-navy dark:text-white">Security monitoring</p><p className="mt-2 text-xs text-muted">Warnings: {attempt.warningCount}/5</p><p className="mt-1 text-xs text-muted">Only you should be visible.</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-dark-surface-alt"><p className="text-sm font-semibold text-navy dark:text-white">Questions</p><div className="mt-3 grid grid-cols-5 gap-2">{attempt.questions.map((item, index) => <button type="button" key={item.id} onClick={() => setQuestionIndex(index)} className={`aspect-square rounded-lg text-sm font-bold ${index === questionIndex ? "bg-primary-blue text-white" : attempt.answers[item.id] ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{index + 1}</button>)}</div></div></aside><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-dark-surface-alt sm:p-9"><div className="flex justify-between text-xs font-bold uppercase tracking-[0.15em] text-primary-blue"><span>Question {questionIndex + 1} of {attempt.questions.length}</span><span>{question.marks} mark{question.marks === 1 ? "" : "s"}</span></div><h1 className="mt-7 text-2xl font-bold leading-snug text-navy dark:text-white">{question.prompt}</h1><p className="mt-2 text-sm text-muted">Select one answer</p><div className="mt-6 grid gap-3">{question.options.map((option, index) => <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${attempt.answers[question.id] === option.id ? "border-primary-blue bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 dark:border-white/10"}`}><input type="radio" name={question.id} checked={attempt.answers[question.id] === option.id} onChange={() => void choose(question.id, option.id)} /><span className="font-semibold text-navy dark:text-white">{String.fromCharCode(65 + index)}.</span><span className="text-navy dark:text-slate-200">{option.label}</span></label>)}</div><div className="mt-8 flex justify-between gap-3 border-t border-slate-100 pt-5 dark:border-white/10"><Button variant="outline" onClick={() => setQuestionIndex(Math.max(0, questionIndex - 1))} disabled={questionIndex === 0}>Previous</Button>{questionIndex < attempt.questions.length - 1 ? <Button onClick={() => setQuestionIndex(questionIndex + 1)}>Next question</Button> : <Button onClick={() => setConfirmSubmit(true)}>Submit examination</Button>}</div>{error ? <p role="alert" className="mt-4 text-sm text-red-600">{error}</p> : null}</section></div>{confirmSubmit ? <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-5"><div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl dark:bg-dark-surface"><p className="text-xs font-bold tracking-[0.15em] text-primary-blue">FINAL SUBMISSION</p><h2 className="mt-2 text-2xl font-bold text-navy dark:text-white">Submit your examination?</h2><p className="mt-3 text-sm leading-6 text-muted dark:text-slate-300">After submission you cannot change your answers or continue this attempt.</p><div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={() => setConfirmSubmit(false)} disabled={submitting}>Review answers</Button><Button onClick={() => void submit()} disabled={submitting}>{submitting ? "Submitting…" : "Confirm submission"}</Button></div></div></div> : null}{monitoringDialog ? <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-5"><div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl dark:bg-dark-surface"><p className="text-xs font-bold tracking-[0.15em] text-primary-blue">EXAM SECURITY</p><h2 className="mt-2 text-2xl font-bold text-navy dark:text-white">{monitoringDialog === "MULTIPLE_FACE" ? "Multiple faces detected" : "Face not detected"}</h2><p className="mt-3 text-sm leading-6 text-muted dark:text-slate-300">{monitoringDialog === "MULTIPLE_FACE" ? "Only the registered candidate should be visible. Please remove other people from the camera view." : "Keep your face visible and centered in the camera view to continue."}</p><Button className="mt-6" onClick={() => setMonitoringDialog(null)}>I understand</Button></div></div> : null}</ExamFrame>;
}

function ExamFrame({ children }: { children: React.ReactNode }) { return <main className="min-h-screen bg-slate-50 px-5 py-10 dark:bg-dark-surface"><div className="mx-auto max-w-6xl">{children}</div></main>; }
function Loading() { return <p role="status" className="flex items-center gap-2 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" />Loading examination…</p>; }
function Message({ title, text }: { title: string; text: string }) { return <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-dark-surface-alt"><h1 className="text-2xl font-bold text-navy dark:text-white">{title}</h1><p className="mt-3 text-sm leading-6 text-muted dark:text-slate-300">{text}</p></div>; }
function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-dark-surface-alt"><div className="flex items-center gap-2 text-primary-blue">{icon}<span className="text-xs font-bold uppercase tracking-wider">{label}</span></div><p className="mt-2 font-semibold text-navy dark:text-white">{value}</p></div>; }
function CameraGate({ onReady, onMessage, onWarning }: { onReady: () => void; onMessage: (message: string) => void; onWarning: (type: "NO_FACE" | "MULTIPLE_FACE" | "CAMERA_LOST") => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const onReadyRef = React.useRef(onReady);
  const onMessageRef = React.useRef(onMessage);
  const onWarningRef = React.useRef(onWarning);
  React.useEffect(() => { onReadyRef.current = onReady; onMessageRef.current = onMessage; onWarningRef.current = onWarning; }, [onMessage, onReady, onWarning]);
  React.useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let retryTimer: number | undefined;
    let lastSignal: { type: string | null; at: number } = { type: null, at: 0 };
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera is not available in this browser.");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        if (cancelled) return stream.getTracks().forEach((track) => track.stop());
        const track = stream.getVideoTracks()[0];
        track?.addEventListener("ended", () => { if (!cancelled) onWarningRef.current("CAMERA_LOST"); });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const tf = await import("@tensorflow/tfjs-core");
        await import("@tensorflow/tfjs-backend-webgl");
        await import("@tensorflow/tfjs-backend-cpu");
        await tf.setBackend("webgl").catch(() => tf.setBackend("cpu"));
        await tf.ready();
        const { load } = await import("@tensorflow-models/blazeface");
        const detector = await load();
        if (cancelled) return;
        onMessageRef.current("Camera ready. Local face monitoring is active; no video is uploaded.");
        onReadyRef.current();
        timer = window.setInterval(async () => {
          if (cancelled || !videoRef.current || videoRef.current.readyState < 2 || !videoRef.current.videoWidth) return;
          try {
            const signal = monitoringSignal(await detector.estimateFaces(videoRef.current, false));
            if (!signal) return;
            const now = Date.now();
            if (lastSignal.type === signal && now - lastSignal.at < 5000) return;
            lastSignal = { type: signal, at: now };
            onWarningRef.current(signal);
          } catch { /* A failed local sample must not stop the camera stream. */ }
        }, 3000);
      } catch (error) {
        stream?.getTracks().forEach((track) => track.stop());
        stream = null;
        if (cancelled) return;
        onMessageRef.current(error instanceof Error ? `${error.message} Allow camera access and try again.` : "Camera permission is required.");
        retryTimer = window.setTimeout(() => { void start(); }, 3000);
      }
    }
    void start();
    return () => { cancelled = true; if (timer) window.clearInterval(timer); if (retryTimer) window.clearTimeout(retryTimer); stream?.getTracks().forEach((track) => track.stop()); };
  }, []);
  return <video ref={videoRef} muted playsInline aria-hidden="true" className="pointer-events-none fixed h-px w-px opacity-0" />;
}
