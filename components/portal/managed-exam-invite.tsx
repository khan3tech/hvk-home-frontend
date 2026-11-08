"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { CheckCircle2, Clock3, Loader2, ShieldCheck } from "lucide-react";
import { ApiError, errorMessage } from "@/lib/api/client";
import { portalApi } from "@/lib/api/portal";
import type { ManagedExamAttempt, ManagedExamInvite } from "@/types/api";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { monitoringSignal } from "@/lib/exam/monitoring";
import { exitExamFullscreen } from "@/lib/exam/fullscreen";
import { useSession } from "@/lib/session/session-provider";

function clientIdFor(token: string): string {
  const key = `hvk-exam-client:${token}`;
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const value = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(key, value);
  return value;
}

function examCacheKey(token: string) { return `hvk-exam-cache:${token}`; }
function pendingAnswerKey(attemptId: string, questionId: string) { return `hvk-exam-pending:${attemptId}:${questionId}`; }
function newIdempotencyKey() { return window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function readExamCache(token: string): { invite?: ManagedExamInvite; attempt?: ManagedExamAttempt } | null {
  try { const value = window.sessionStorage.getItem(examCacheKey(token)); return value ? JSON.parse(value) as { invite?: ManagedExamInvite; attempt?: ManagedExamAttempt } : null; }
  catch { return null; }
}

function formatTime(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatDeadline(value: string): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(value));
}

export function ManagedExamInvite({ examId }: { examId?: string } = {}) {
  const params = useParams<{ token?: string }>();
  const token = params.token ?? "";
  const inviteReference = examId ?? token;
  if (!inviteReference) throw new Error("A managed exam identifier is required.");
  const router = useRouter();
  const pathname = usePathname();
  const { status: sessionStatus } = useSession();
  const [invite, setInvite] = React.useState<ManagedExamInvite | null>(null);
  const [attempt, setAttempt] = React.useState<ManagedExamAttempt | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [activeConflict, setActiveConflict] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [starting, setStarting] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmSubmit, setConfirmSubmit] = React.useState(false);
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const paletteRef = React.useRef<HTMLDivElement>(null);
  // Keep the current question visible in the (scrollable) question navigator.
  React.useEffect(() => {
    const box = paletteRef.current;
    const button = box?.querySelector<HTMLElement>(`[data-q="${questionIndex}"]`);
    if (box && button) box.scrollTop = button.offsetTop - box.clientHeight / 2 + button.clientHeight / 2;
  }, [questionIndex]);
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const [cameraReady, setCameraReady] = React.useState(false);
  const [cameraLost, setCameraLost] = React.useState(false);
  const [saveState, setSaveState] = React.useState<'saved' | 'saving' | 'error' | 'offline'>('saved');
  const [online, setOnline] = React.useState(true);
  const saveQueue = React.useRef<Promise<void>>(Promise.resolve());
  const flushRunning = React.useRef(false);
  const saveFailed = React.useRef(false);
  const submissionFullscreenExit = React.useRef(false);
  const serverRevision = React.useRef(0);
  const [cameraMessage, setCameraMessage] = React.useState("Camera permission is required before starting.");
  const [monitoringDialog, setMonitoringDialog] = React.useState<"NO_FACE" | "MULTIPLE_FACE" | null>(null);
  const [securityDialog, setSecurityDialog] = React.useState<"TAB_HIDDEN" | "FULLSCREEN_EXIT" | null>(null);
  const sessionId = attempt?.sessionId ?? null;
  const attemptId = attempt?.id ?? null;
  const attemptState = attempt?.state ?? null;
  const deadlineAt = attempt?.deadlineAt ?? null;
  const clientInstanceId = React.useMemo(() => (typeof window === "undefined" ? "" : clientIdFor(inviteReference)), [inviteReference]);
  React.useEffect(() => {
    if (!invite) return;
    try { window.sessionStorage.setItem(`hvk-exam-client:${invite.id}`, clientInstanceId); }
    catch { /* The client ID is also kept in component state for this page session. */ }
  }, [clientInstanceId, invite]);
  const onCameraReady = React.useCallback(() => { setCameraLost(false); setCameraReady(true); }, []);
  const onCameraMessage = React.useCallback((message: string) => setCameraMessage(message), []);
  const onCameraWarning = React.useCallback((type: "NO_FACE" | "MULTIPLE_FACE" | "CAMERA_LOST") => {
    if (type !== "CAMERA_LOST") setMonitoringDialog(type);
    else { setCameraLost(true); setCameraReady(false); setCameraMessage("Camera connection was lost. Reload this page to reconnect before continuing."); }
    if (!attempt || !sessionId) return;
    void portalApi.recordManagedExamMonitoring(attempt.id, type, sessionId, clientInstanceId, newIdempotencyKey())
      .then((result) => setAttempt((current) => current ? { ...current, warningCount: result.warningCount } : current))
      .catch(() => undefined);
  }, [attempt, clientInstanceId, sessionId, setMonitoringDialog]);

  React.useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    let cancelled = false;
    const cached = readExamCache(inviteReference);
    const cachedInvite = cached?.invite;
    const cachedAttempt = cached?.attempt;
    if (cachedInvite) {
      queueMicrotask(() => {
        if (cancelled) return;
        setInvite(cachedInvite);
        if (cachedAttempt) { setAttempt(cachedAttempt); serverRevision.current = cachedAttempt.version; }
      });
    }
    (examId ? portalApi.managedExamById(examId) : portalApi.managedExamInvite(token)).then((data) => { if (!cancelled) setInvite(data); }).catch((err: unknown) => { if (!cancelled && !cachedInvite) setError(errorMessage(err)); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [examId, inviteReference, sessionStatus, token]);

  React.useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => { window.removeEventListener("online", updateOnline); window.removeEventListener("offline", updateOnline); };
  }, []);

  React.useEffect(() => {
    if (!invite) return;
    try { window.sessionStorage.setItem(examCacheKey(inviteReference), JSON.stringify({ invite, ...(attempt ? { attempt } : {}) })); }
    catch { /* The server remains authoritative if browser storage is unavailable. */ }
  }, [attempt, invite, inviteReference]);

  React.useEffect(() => {
    if (sessionStatus === "anonymous") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [pathname, router, sessionStatus]);

  React.useEffect(() => {
    if (!deadlineAt || attemptState !== "in_progress") return;
    let expiryRefreshRequested = false;
    const tick = () => {
      const next = Math.max(0, Date.parse(deadlineAt) - Date.now());
      setRemaining(next);
      if (next === 0 && !expiryRefreshRequested && attemptId && sessionId) {
        expiryRefreshRequested = true;
        void portalApi.managedExamAttempt(attemptId, sessionId, clientInstanceId).then(setAttempt).catch(() => undefined);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = "Your examination is still in progress."; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => { window.clearInterval(id); window.removeEventListener("beforeunload", beforeUnload); };
  }, [attemptId, attemptState, clientInstanceId, deadlineAt, sessionId]);

  React.useEffect(() => {
    if (!online || !attemptId || attemptState !== "in_progress" || !sessionId || !clientInstanceId || flushRunning.current) return;
    const activeAttemptId = attemptId;
    const activeSessionId = sessionId;
    const activeClientInstanceId = clientInstanceId;
    let cancelled = false;
    async function flushPendingAnswers() {
      flushRunning.current = true;
      try {
        const prefix = `hvk-exam-pending:${activeAttemptId}:`;
        const items: Array<{ key: string; questionId: string; selectedOptionId: string; idempotencyKey: string }> = [];
        for (let index = 0; index < window.sessionStorage.length; index += 1) {
          const key = window.sessionStorage.key(index);
          if (!key?.startsWith(prefix)) continue;
          try { items.push({ key, ...JSON.parse(window.sessionStorage.getItem(key) ?? "{}") as Omit<typeof items[number], "key"> }); }
          catch { window.sessionStorage.removeItem(key); }
        }
        for (const item of items) {
          if (cancelled || !navigator.onLine) break;
          saveQueue.current = saveQueue.current.catch(() => undefined).then(async () => {
            try {
              const saved = await portalApi.saveManagedExamAnswer(activeAttemptId, item.questionId, item.selectedOptionId, activeSessionId, activeClientInstanceId, serverRevision.current, item.idempotencyKey);
              serverRevision.current = saved.serverRevision;
              window.sessionStorage.removeItem(item.key);
              saveFailed.current = false;
              setSaveState("saved");
              setError(null);
              setAttempt((current) => current ? { ...current, version: saved.serverRevision, answers: { ...current.answers, [item.questionId]: item.selectedOptionId } } : current);
            } catch (err) {
              if (err instanceof ApiError && err.code === "STALE_ANSWER_VERSION") {
                try {
                  const current = await portalApi.managedExamAttempt(activeAttemptId, activeSessionId, activeClientInstanceId);
                  serverRevision.current = current.version;
                  const saved = await portalApi.saveManagedExamAnswer(activeAttemptId, item.questionId, item.selectedOptionId, activeSessionId, activeClientInstanceId, current.version, item.idempotencyKey);
                  serverRevision.current = saved.serverRevision;
                  window.sessionStorage.removeItem(item.key);
                  saveFailed.current = false;
                  setSaveState("saved");
                  setError(null);
                  setAttempt({ ...current, version: saved.serverRevision, answers: { ...current.answers, [item.questionId]: item.selectedOptionId } });
                  return;
                } catch { /* Keep the local answer queued until the next reconnect. */ }
              }
              saveFailed.current = true;
              setSaveState(navigator.onLine ? "error" : "offline");
              if (navigator.onLine) setError(errorMessage(err));
            }
          });
          await saveQueue.current;
        }
      } finally { flushRunning.current = false; }
    }
    void flushPendingAnswers();
    return () => { cancelled = true; };
  }, [attemptId, attemptState, clientInstanceId, online, sessionId]);

  React.useEffect(() => {
    if (!attemptId || attemptState !== "in_progress" || !sessionId) return;
    const record = (type: "TAB_HIDDEN" | "FULLSCREEN_EXIT") => { setSecurityDialog(type); void portalApi.recordManagedExamMonitoring(attemptId, type, sessionId, clientInstanceId, newIdempotencyKey()).then((result) => setAttempt((current) => current ? { ...current, warningCount: result.warningCount } : current)).catch(() => undefined); };
    const onVisibility = () => { if (document.visibilityState === "hidden") record("TAB_HIDDEN"); };
    const onFullscreen = () => { if (!document.fullscreenElement && !submissionFullscreenExit.current) record("FULLSCREEN_EXIT"); };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => { document.removeEventListener("visibilitychange", onVisibility); document.removeEventListener("fullscreenchange", onFullscreen); };
  }, [attemptId, attemptState, clientInstanceId, sessionId]);

  React.useEffect(() => {
    if (!attemptId || attemptState !== "in_progress") return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let retryTimer: number | undefined;
    let cameraFailureReported = false;
    let video: HTMLVideoElement | null = null;
    let lastSignal: { type: string | null; at: number } = { type: null, at: 0 };
    function reportCameraFailure() {
      setCameraLost(true);
      if (cameraFailureReported) return;
      cameraFailureReported = true;
      onCameraWarning("CAMERA_LOST");
    }
    function retryCamera() {
      if (!cancelled && retryTimer === undefined) retryTimer = window.setTimeout(() => { retryTimer = undefined; void monitor(); }, 3000);
    }
    async function monitor() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera is not available in this browser.");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        setCameraLost(false);
        cameraFailureReported = false;
        if (retryTimer !== undefined) window.clearTimeout(retryTimer);
        retryTimer = undefined;
        if (cancelled) return stream.getTracks().forEach((track) => track.stop());
        stream.getVideoTracks()[0]?.addEventListener("ended", () => { if (!cancelled) { reportCameraFailure(); stream?.getTracks().forEach((track) => track.stop()); retryCamera(); } });
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
      } catch { if (!cancelled) { reportCameraFailure(); retryCamera(); } }
    }
    void monitor();
    return () => { cancelled = true; if (timer) window.clearInterval(timer); if (retryTimer !== undefined) window.clearTimeout(retryTimer); stream?.getTracks().forEach((track) => track.stop()); video = null; };
  }, [attemptId, attemptState, onCameraWarning]);

  async function start() {
    setError(null); setStarting(true);
    try {
      if (cameraRequired && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen().catch(() => undefined);
      const next = examId ? await portalApi.startManagedExamById(examId, clientInstanceId) : await portalApi.startManagedExam(token, clientInstanceId);
      setAttempt(next);
      serverRevision.current = next.version;
      setInvite((current) => current ? { ...current, inviteStatus: "started" } : current);
    } catch (err) {
      if (err instanceof ApiError && err.code === "ACTIVE_SESSION_EXISTS") setActiveConflict(true);
      else setError(errorMessage(err));
    } finally { setStarting(false); }
  }

  async function choose(questionId: string, optionId: string) {
    if (!attempt || !sessionId || attempt.state !== "in_progress") return;
    const pending = { questionId, selectedOptionId: optionId, idempotencyKey: newIdempotencyKey() };
    try { window.sessionStorage.setItem(pendingAnswerKey(attempt.id, questionId), JSON.stringify(pending)); }
    catch { /* Keep the current selection in memory if browser storage is unavailable. */ }
    setAttempt((current) => current ? { ...current, answers: { ...current.answers, [questionId]: optionId } } : current);
    if (!navigator.onLine || !online) {
      saveFailed.current = true;
      setSaveState("offline");
      setError(null);
      return;
    }
    setSaveState('saving');
    saveQueue.current = saveQueue.current.catch(() => undefined).then(async () => {
      try {
        const saved = await portalApi.saveManagedExamAnswer(attempt.id, questionId, optionId, sessionId, clientInstanceId, serverRevision.current, pending.idempotencyKey);
        serverRevision.current = saved.serverRevision;
        window.sessionStorage.removeItem(pendingAnswerKey(attempt.id, questionId));
        setAttempt((current) => current ? { ...current, version: saved.serverRevision } : current);
        saveFailed.current = false;
        setSaveState('saved');
        setError(null);
      } catch (err) {
        try {
          if (err instanceof ApiError && err.code === "STALE_ANSWER_VERSION") {
            const current = await portalApi.managedExamAttempt(attempt.id, sessionId, clientInstanceId);
            serverRevision.current = current.version;
            const saved = await portalApi.saveManagedExamAnswer(attempt.id, questionId, optionId, sessionId, clientInstanceId, current.version, pending.idempotencyKey);
            serverRevision.current = saved.serverRevision;
            window.sessionStorage.removeItem(pendingAnswerKey(attempt.id, questionId));
            setAttempt({ ...current, version: saved.serverRevision, answers: { ...current.answers, [questionId]: optionId } });
            saveFailed.current = false;
            setSaveState("saved");
            setError(null);
            return;
          }
        } catch { /* Keep the local selection queued for reconnect. */ }
        saveFailed.current = true;
        setSaveState(navigator.onLine ? 'error' : 'offline');
        if (navigator.onLine) setError(errorMessage(err));
      }
    });
    await saveQueue.current;
  }

  async function submit() {
    if (!attempt || !sessionId) return;
    setSubmitting(true);
    try {
      await saveQueue.current;
      if (!navigator.onLine || !online) throw new Error('Reconnect to the internet and wait for all answers to save before submitting.');
      if (saveFailed.current) throw new Error('Please resolve the answer save issue before submitting.');
      const submitted = await portalApi.submitManagedExam(attempt.id, sessionId, clientInstanceId, newIdempotencyKey());
      submissionFullscreenExit.current = true;
      await exitExamFullscreen();
      setAttempt(submitted); setSaveState('saved'); setConfirmSubmit(false); setSecurityDialog(null);
    } catch (err) { setError(errorMessage(err)); }
    finally { setSubmitting(false); }
  }

  if (sessionStatus !== "authenticated" || loading) return <ExamFrame><Loading /></ExamFrame>;
  if (error && !invite) return <ExamFrame><Message title="Unable to open examination" text={error} /></ExamFrame>;
  if (!invite) return null;
  if (activeConflict) return <ExamFrame><Message title="Examination already open" text="This examination is already open in another tab or device. Return to the original examination window to continue." /></ExamFrame>;
  const cameraRequired = invite.inviteStatus === "invited" || invite.inviteStatus === "started";
  if (!attempt) return <ExamFrame><div className="mx-auto max-w-2xl space-y-6"><div><p className="text-xs font-bold tracking-[0.18em] text-primary-blue">EXAMINATION INVITATION</p><h1 className="mt-2 text-3xl font-bold text-navy dark:text-white">{invite.title}</h1><p className="mt-3 text-muted dark:text-slate-300">{invite.description || "Complete this examination in one focused session."}</p></div><div className="grid gap-3 sm:grid-cols-3">{invite.expiresAt ? <Info icon={<Clock3 className="h-4 w-4" />} label="Link valid until" value={`${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(invite.expiresAt))} IST`} /> : <Info icon={<Clock3 className="h-4 w-4" />} label="Exam date" value={new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" }).format(new Date(invite.scheduledDate))} />}<Info icon={<Clock3 className="h-4 w-4" />} label="Duration" value={`${invite.durationMinutes} minutes`} /><Info icon={<ShieldCheck className="h-4 w-4" />} label="Security" value="Camera and fullscreen" /><Info icon={<CheckCircle2 className="h-4 w-4" />} label="Questions" value={String(invite.questionCount)} /></div><div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-muted shadow-sm dark:border-white/10 dark:bg-dark-surface-alt dark:text-slate-300">Your answers are saved as you go. Only manual submission finalizes the examination. Do not close this window while the attempt is active.</div>{cameraRequired ? <><CameraGate onReady={onCameraReady} onMessage={onCameraMessage} onWarning={onCameraWarning} cameraReady={cameraReady} /><p className="text-sm text-muted">{cameraMessage}</p>{cameraLost ? <Button variant="outline" onClick={() => window.location.reload()}>Reload to reconnect camera</Button> : null}</> : <p className="rounded-xl bg-slate-100 p-4 text-sm text-muted dark:bg-dark-surface-alt">This attempt has already been finalized. Continue to view its submission and result status.</p>}<Button size="lg" onClick={() => void start()} disabled={starting || (cameraRequired && !cameraReady)}>{starting ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening…</> : invite.inviteStatus === "started" ? "Resume examination" : invite.inviteStatus === "submitted" ? "View submission status" : invite.inviteStatus === "expired" ? "View exam status" : "Start examination"}</Button>{error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}</div></ExamFrame>;

  if (attempt.state !== "in_progress") return <ExamFrame><div className="mx-auto max-w-xl space-y-4"><Message title={attempt.state === "expired" ? "Time expired" : attempt.resultPublished ? "Exam result" : "Submission received"} text={attempt.state === "expired" ? "The deadline ended before manual submission. No result was created." : attempt.resultPublished ? `Your score: ${attempt.score ?? 0} / ${attempt.totalMarks ?? 0}.${attempt.qualification ? ` ${attempt.qualification === "QUALIFIED" ? "Qualified." : attempt.qualification === "NOT_QUALIFIED" ? "Not qualified." : ""}` : ""}` : "Your examination was submitted. The result will appear after administrator publication."} />{invite.expiresAt ? <Link href="/feedback" className={buttonVariants({ size: "lg" })}>Continue to feedback</Link> : null}{attempt.state === "submitted" && !attempt.resultPublished ? <Button variant="outline" disabled={!sessionId} onClick={() => { setLoading(true); void portalApi.managedExamAttempt(attempt.id, sessionId ?? "", clientInstanceId).then((latest) => { setAttempt(latest); setLoading(false); setError(null); }).catch((err: unknown) => { setError(errorMessage(err)); setLoading(false); }); }}>Check for published result</Button> : null}{error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}</div></ExamFrame>;
  const question = attempt.questions[questionIndex];
  if (!question) return <ExamFrame><Message title="No questions available" text="The examination question set could not be loaded." /></ExamFrame>;
  const answeredCount = attempt.questions.filter((item) => Boolean(attempt.answers[item.id])).length;
  const progress = Math.round((answeredCount / attempt.questions.length) * 100);
  return <ExamFrame><div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[220px_1fr]"><aside className="space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto"><div className="rounded-2xl bg-navy p-5 text-white"><p className="text-xs font-bold tracking-[0.15em] text-slate-300">TIME REMAINING</p><p className="mt-2 text-3xl font-bold">{formatTime(remaining ?? 0)}</p><p className="mt-2 text-sm text-slate-300">Deadline {formatDeadline(attempt.deadlineAt)} IST</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-dark-surface-alt"><p className="text-sm font-semibold text-navy dark:text-white">Security monitoring</p><p className="mt-2 text-xs text-muted">Warnings: {attempt.warningCount}/5</p>{cameraLost ? <p role="alert" className="mt-2 text-xs text-amber-700">Camera disconnected. Reload to reconnect and resume this attempt.</p> : null}<p role="status" className="mt-1 text-xs text-muted">{saveState === 'saving' ? 'Saving answers…' : saveState === 'error' ? 'A save needs attention.' : saveState === 'offline' ? 'Offline — answer is stored on this device and will sync after reconnecting.' : 'All answers saved.'}</p><p className="mt-1 text-xs text-muted">Only you should be visible.</p><p role="status" className={`mt-1 text-xs ${online ? "text-emerald-700" : "text-amber-700"}`}>{online ? "Connected" : "Offline mode"}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-dark-surface-alt"><p className="text-sm font-semibold text-navy dark:text-white">Questions <span className="font-normal text-muted">{answeredCount}/{attempt.questions.length} answered</span></p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-primary-blue transition-all" style={{ width: `${progress}%` }} /></div><div ref={paletteRef} className="relative mt-3 grid max-h-64 grid-cols-5 gap-2 overflow-y-auto pr-1" aria-label="Question navigator">{attempt.questions.map((item, index) => <button type="button" key={item.id} data-q={index} aria-current={index === questionIndex ? "true" : undefined} aria-label={`Question ${index + 1}${attempt.answers[item.id] ? ", answered" : ""}`} onClick={() => setQuestionIndex(index)} className={`aspect-square rounded-lg text-sm font-bold ${index === questionIndex ? "bg-primary-blue text-white" : attempt.answers[item.id] ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{index + 1}</button>)}</div></div></aside><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-dark-surface-alt sm:p-9"><div className="flex justify-between text-xs font-bold uppercase tracking-[0.15em] text-primary-blue"><span>Question {questionIndex + 1} of {attempt.questions.length}</span><span>{question.marks} mark{question.marks === 1 ? "" : "s"}</span></div><h1 className="mt-7 text-2xl font-bold leading-snug text-navy dark:text-white">{question.prompt}</h1><p className="mt-2 text-sm text-muted">Select one answer</p><div className="mt-6 grid gap-3">{question.options.map((option, index) => <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${attempt.answers[question.id] === option.id ? "border-primary-blue bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 dark:border-white/10"}`}><input type="radio" name={question.id} checked={attempt.answers[question.id] === option.id} onChange={() => void choose(question.id, option.id)} /><span className="font-semibold text-navy dark:text-white">{String.fromCharCode(65 + index)}.</span><span className="text-navy dark:text-slate-200">{option.label}</span></label>)}</div><div className="mt-8 flex justify-between gap-3 border-t border-slate-100 pt-5 dark:border-white/10"><Button variant="outline" onClick={() => setQuestionIndex(Math.max(0, questionIndex - 1))} disabled={questionIndex === 0}>Previous</Button>{questionIndex < attempt.questions.length - 1 ? <Button onClick={() => setQuestionIndex(questionIndex + 1)}>Next question</Button> : <Button onClick={() => setConfirmSubmit(true)}>Submit examination</Button>}</div>{error ? <p role="alert" className="mt-4 text-sm text-red-600">{error}</p> : null}</section></div>{confirmSubmit ? <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-5"><div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl dark:bg-dark-surface"><p className="text-xs font-bold tracking-[0.15em] text-primary-blue">FINAL SUBMISSION</p><h2 className="mt-2 text-2xl font-bold text-navy dark:text-white">Submit your examination?</h2><p className="mt-3 text-sm leading-6 text-muted dark:text-slate-300">After submission you cannot change your answers or continue this attempt.</p><div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/5"><div><span className="text-muted">Answered questions</span><strong className="mt-1 block text-navy dark:text-white">{answeredCount} of {attempt.questions.length}</strong></div><div><span className="text-muted">Remaining</span><strong className="mt-1 block text-navy dark:text-white">{Math.max(0, attempt.questions.length - answeredCount)}</strong></div></div><div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={() => setConfirmSubmit(false)} disabled={submitting}>Review answers</Button><Button onClick={() => void submit()} disabled={submitting}>{submitting ? "Submitting…" : "Confirm submission"}</Button></div></div></div> : null}{securityDialog ? <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-5"><div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl dark:bg-dark-surface"><p className="text-xs font-bold tracking-[0.15em] text-primary-blue">EXAM SECURITY</p><h2 className="mt-2 text-2xl font-bold text-navy dark:text-white">{securityDialog === "TAB_HIDDEN" ? "Stay on the examination" : "Fullscreen was exited"}</h2><p className="mt-3 text-sm leading-6 text-muted dark:text-slate-300">{securityDialog === "TAB_HIDDEN" ? "Leaving this examination tab was detected. Keep this window active while you continue." : "Return to fullscreen before continuing the examination."}</p><div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={() => setSecurityDialog(null)}>Continue</Button>{securityDialog === "FULLSCREEN_EXIT" ? <Button onClick={() => { void document.documentElement.requestFullscreen?.().catch(() => undefined); setSecurityDialog(null); }}>Re-enter fullscreen</Button> : null}</div></div></div> : null}{monitoringDialog ? <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-5"><div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl dark:bg-dark-surface"><p className="text-xs font-bold tracking-[0.15em] text-primary-blue">EXAM SECURITY</p><h2 className="mt-2 text-2xl font-bold text-navy dark:text-white">{monitoringDialog === "MULTIPLE_FACE" ? "Multiple faces detected" : "Face not detected"}</h2><p className="mt-3 text-sm leading-6 text-muted dark:text-slate-300">{monitoringDialog === "MULTIPLE_FACE" ? "Only the registered candidate should be visible. Please remove other people from the camera view." : "Keep your face visible and centered in the camera view to continue."}</p><Button className="mt-6" onClick={() => setMonitoringDialog(null)}>I understand</Button></div></div> : null}</ExamFrame>;
}

function ExamFrame({ children }: { children: React.ReactNode }) { return <main className="min-h-screen bg-slate-50 px-5 py-10 dark:bg-dark-surface"><div className="mx-auto max-w-6xl">{children}</div></main>; }
function Loading() { return <p role="status" className="flex items-center gap-2 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" />Loading examination…</p>; }
function Message({ title, text }: { title: string; text: string }) { return <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-dark-surface-alt"><h1 className="text-2xl font-bold text-navy dark:text-white">{title}</h1><p className="mt-3 text-sm leading-6 text-muted dark:text-slate-300">{text}</p></div>; }
function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-dark-surface-alt"><div className="flex items-center gap-2 text-primary-blue">{icon}<span className="text-xs font-bold uppercase tracking-wider">{label}</span></div><p className="mt-2 font-semibold text-navy dark:text-white">{value}</p></div>; }
function CameraGate({ onReady, onMessage, onWarning, cameraReady }: { onReady: () => void; onMessage: (message: string) => void; onWarning: (type: "NO_FACE" | "MULTIPLE_FACE" | "CAMERA_LOST") => void; cameraReady: boolean }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const onReadyRef = React.useRef(onReady);
  const onMessageRef = React.useRef(onMessage);
  const onWarningRef = React.useRef(onWarning);
  React.useEffect(() => { onReadyRef.current = onReady; onMessageRef.current = onMessage; onWarningRef.current = onWarning; }, [onMessage, onReady, onWarning]);
  const [requested, setRequested] = React.useState(false);
  const [requesting, setRequesting] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let retryTimer: number | undefined;
    let lastSignal: { type: string | null; at: number } = { type: null, at: 0 };
    async function start() {
      if (cancelled || !requested) return;
      setRequesting(true);
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
        setRequesting(false);
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
        setRequesting(false);
        onMessageRef.current(error instanceof Error ? `${error.message} Allow camera access and try again.` : "Camera permission is required.");
        retryTimer = window.setTimeout(() => { void start(); }, 3000);
      }
    }
    if (requested) void start();
    return () => { cancelled = true; if (timer) window.clearInterval(timer); if (retryTimer) window.clearTimeout(retryTimer); stream?.getTracks().forEach((track) => track.stop()); };
  }, [requested]);
  return <><video ref={videoRef} muted playsInline aria-hidden="true" className="pointer-events-none fixed h-px w-px opacity-0" /><Button type="button" variant="outline" onClick={() => setRequested(true)} disabled={requesting || cameraReady || requested}>{requesting || requested ? "Checking camera…" : cameraReady ? "Camera ready" : "Enable camera and check readiness"}</Button></>;
}
