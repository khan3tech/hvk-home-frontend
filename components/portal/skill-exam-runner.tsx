"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, Camera, CheckCircle2, Clock, Maximize, MessageSquare, MonitorUp, PartyPopper, ShieldCheck, WifiOff } from "lucide-react";
import type { SkillAttempt, SkillExam, SkillExamResult, SkillTerminationReason } from "@/types/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { ContactMenu } from "@/components/layout/contact-menu";
import { ApiError, errorMessage } from "@/lib/api/client";
import { skillExamApi } from "@/lib/api/skill-exams";
import { MAX_FACE_WARNINGS, proctoring, type FaceDetector } from "@/lib/exam/proctoring";
import { cn } from "@/lib/utils";
import { FormMessage } from "./form-field";
import { PageShell } from "./page-shell";
import { StatusCard } from "./status-card";

/** "12:05" or "1:02:05". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

const DASHBOARD = "/dashboard";
const FACE_CHECK_MS = 3000;
const RETRY_MS = 5000;
const HEARTBEAT_MS = 30_000;

/** Exam terms shown before the start (QA item 8). */
export const EXAM_TERMS = [
  "This is a one-time exam. Once you start it, every other exam is locked.",
  "Stay on this page, in fullscreen, until you submit. Switching to another tab or app, leaving fullscreen, refreshing or closing the page ends the exam at once.",
  "Keep your camera on with only your face in view. After 3 warnings (no face, or more than one person) the exam ends.",
  'Share your entire screen when asked and keep sharing until you submit. Stopping the screen share ends the exam.',
  "Nothing is recorded or uploaded: the face checks run on your own device.",
  "If your internet drops, stay on this page. The exam reconnects by itself and your timer keeps running. If the exam cannot reach us for 5 minutes (no internet, power cut, browser or computer closed) it ends automatically.",
  "An exam that has ended cannot be continued. Contact us if you need help.",
];

const END_REASON: Record<SkillTerminationReason, string> = {
  tab_hidden: "You switched to another tab or app.",
  fullscreen_exit: "You left fullscreen.",
  screen_share_stopped: "Screen sharing was stopped.",
  face_violations: "Your face was not clearly visible, or someone else was seen, too many times.",
  camera_lost: "The camera was turned off.",
  left_exam: "You left the exam page.",
  connection_lost: "We lost contact with your exam for more than 5 minutes (internet, power or the browser was closed).",
  ended_by_staff: "Our team ended this exam.",
};

type Phase =
  | { kind: "loading" }
  | { kind: "blocked"; message: string; payment?: boolean }
  | { kind: "locked" }
  | { kind: "gate"; exam: SkillExam }
  | { kind: "taking"; attempt: SkillAttempt; media: Media }
  | { kind: "ended"; reason?: SkillTerminationReason }
  | { kind: "result"; result: SkillExamResult };

interface Media {
  camera: MediaStream;
  screen: MediaStream;
  detector: FaceDetector;
}

/** A course or domain exam: one attempt, proctored; leaving the exam ends it (QA items 8–12). */
export function SkillExamRunner({ examId }: { examId: string }) {
  const [phase, setPhase] = React.useState<Phase>({ kind: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const exam = (await skillExamApi.list()).find((e) => e.id === examId);
        if (cancelled) return;
        if (!exam) return setPhase({ kind: "blocked", message: "This exam is not available." });
        if (!exam.unlocked) return setPhase({ kind: "blocked", message: "The exams unlock after you pay the registration fee.", payment: true });
        if (exam.state === "locked") return setPhase({ kind: "locked" });
        if (exam.state === "available") return setPhase({ kind: "gate", exam });
        if (exam.state === "in_progress" && exam.attemptId) {
          // Came back to an exam that was still open: it cannot be continued.
          await skillExamApi.terminate(exam.attemptId, "left_exam").catch(() => undefined);
          if (!cancelled) setPhase({ kind: "ended", reason: "left_exam" });
          return;
        }
        const view = await skillExamApi.attempt(exam.attemptId!);
        if (!cancelled) setPhase(view.state === "terminated" ? { kind: "ended" } : { kind: "result", result: view.result });
      } catch (err) {
        if (!cancelled) setPhase({ kind: "blocked", message: errorMessage(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examId]);

  if (phase.kind === "loading") return <StatusCard tone="loading" title="Getting your exam ready…" />;
  if (phase.kind === "blocked") {
    return (
      <StatusCard tone="error" title="We can't open this exam">
        <p>{phase.message}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {phase.payment ? (
            <Link href="/payment" className={buttonVariants({})}>
              Go to payment
            </Link>
          ) : null}
          <Link href={DASHBOARD} className={buttonVariants({ variant: "outline" })}>
            Back to Dashboard
          </Link>
        </div>
      </StatusCard>
    );
  }
  if (phase.kind === "locked") return <Ended title="You have already taken your exam" text="Only one exam can be taken. If you need another attempt, please contact our team." />;
  if (phase.kind === "ended") {
    return <Ended title="Your exam has ended" text={`${phase.reason ? `${END_REASON[phase.reason]} ` : ""}An exam that has ended cannot be continued. Please contact us for further process.`} />;
  }
  if (phase.kind === "result") return <Result result={phase.result} />;
  if (phase.kind === "gate") {
    return (
      <Gate
        exam={phase.exam}
        onStarted={(attempt, media) => setPhase({ kind: "taking", attempt, media })}
        onEnded={() => setPhase({ kind: "ended", reason: "left_exam" })}
        onLocked={() => setPhase({ kind: "locked" })}
      />
    );
  }
  return (
    <Taking
      key={phase.attempt.id}
      attempt={phase.attempt}
      media={phase.media}
      onResult={(result) => setPhase(result.outcome === "terminated" ? { kind: "ended" } : { kind: "result", result })}
      onEnded={(reason) => setPhase({ kind: "ended", reason })}
    />
  );
}

/** Contact us + Back to Dashboard, for an exam that cannot continue. */
function Ended({ title, text }: { title: string; text: string }) {
  return (
    <PageShell title={title} width="max-w-2xl">
      <div className="text-center" role="status">
        <AlertTriangle className="mx-auto h-14 w-14 text-amber-500" aria-hidden="true" />
        <p className="mt-4 text-sm text-ink dark:text-slate-200">{text}</p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ContactMenu label="Contact us" className={buttonVariants({})} />
        <Link href={DASHBOARD} className={buttonVariants({ variant: "outline" })}>
          Back to Dashboard
        </Link>
      </div>
    </PageShell>
  );
}

/** Terms, camera, entire-screen share and fullscreen, then the start (QA item 8). */
function Gate({ exam, onStarted, onEnded, onLocked }: { exam: SkillExam; onStarted: (a: SkillAttempt, m: Media) => void; onEnded: () => void; onLocked: () => void }) {
  const [agreed, setAgreed] = React.useState(false);
  const [camera, setCamera] = React.useState<MediaStream | null>(null);
  const [detector, setDetector] = React.useState<FaceDetector | null>(null);
  const [screen, setScreen] = React.useState<MediaStream | null>(null);
  const [busy, setBusy] = React.useState<"camera" | "screen" | "start" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const started = React.useRef(false);
  const media = React.useRef<{ camera: MediaStream | null; screen: MediaStream | null }>({ camera: null, screen: null });

  // Leaving the page before starting releases the camera and the screen share.
  React.useEffect(
    () => () => {
      if (!started.current) {
        proctoring.stop(media.current.camera);
        proctoring.stop(media.current.screen);
      }
    },
    [],
  );

  async function turnOnCamera() {
    setBusy("camera");
    setError(null);
    try {
      const stream = await proctoring.requestCamera();
      media.current.camera = stream;
      setCamera(stream);
      setDetector(await proctoring.loadFaceDetector());
    } catch (err) {
      setError(err instanceof Error ? `${err.message} Allow camera access and try again.` : "Camera access is required.");
    } finally {
      setBusy(null);
    }
  }

  async function shareScreen() {
    setBusy("screen");
    setError(null);
    try {
      const stream = await proctoring.requestScreen();
      media.current.screen = stream;
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (!started.current) setScreen(null);
      });
      setScreen(stream);
    } catch (err) {
      setError(err instanceof Error && err.name !== "NotAllowedError" ? err.message : "Screen sharing is required. Choose your entire screen.");
    } finally {
      setBusy(null);
    }
  }

  async function start() {
    if (!camera || !screen || !detector) return;
    setBusy("start");
    setError(null);
    try {
      await proctoring.enterFullscreen();
    } catch {
      setBusy(null);
      setError("Fullscreen is required. Allow fullscreen and try again.");
      return;
    }
    try {
      const attempt = await skillExamApi.start(exam.id);
      started.current = true;
      onStarted(attempt, { camera, screen, detector });
    } catch (err) {
      await proctoring.exitFullscreen();
      setBusy(null);
      if (err instanceof ApiError && err.code === "EXAM_ENDED") return onEnded();
      if (err instanceof ApiError && err.code === "EXAM_LOCKED") return onLocked();
      setError(errorMessage(err));
    }
  }

  const ready = agreed && camera && detector && screen;
  return (
    <PageShell eyebrow="Before you start" title={exam.title} intro={`${exam.questionCount} questions · ${exam.durationMinutes} minutes`} width="max-w-3xl">
      <section aria-labelledby="terms-heading" className="rounded-xl2 border border-slate-100 p-5 dark:border-white/10">
        <h2 id="terms-heading" className="flex items-center gap-2 font-bold text-navy dark:text-white">
          <ShieldCheck className="h-5 w-5 text-primary-blue dark:text-bright-blue" aria-hidden="true" /> Exam terms and conditions
        </h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink dark:text-slate-200">
          {EXAM_TERMS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
        <label className="mt-4 flex items-start gap-2 text-sm font-semibold text-navy dark:text-white">
          <input type="checkbox" className="mt-0.5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          I have read and agree to the exam terms and conditions
        </label>
      </section>

      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        <Step done={Boolean(camera && detector)} icon={<Camera className="h-5 w-5" aria-hidden="true" />} title="1. Camera">
          <Button size="sm" variant="outline" onClick={() => void turnOnCamera()} disabled={Boolean(camera) || busy !== null} loading={busy === "camera"}>
            {busy === "camera" ? "Checking camera…" : camera && detector ? "Camera ready" : "Turn on camera"}
          </Button>
        </Step>
        <Step done={Boolean(screen)} icon={<MonitorUp className="h-5 w-5" aria-hidden="true" />} title="2. Entire screen">
          <Button size="sm" variant="outline" onClick={() => void shareScreen()} disabled={Boolean(screen) || busy !== null} loading={busy === "screen"}>
            {screen ? "Screen shared" : "Share entire screen"}
          </Button>
        </Step>
        <Step done={false} icon={<Maximize className="h-5 w-5" aria-hidden="true" />} title="3. Fullscreen">
          <Button size="sm" onClick={() => void start()} disabled={!ready || busy !== null} loading={busy === "start"}>
            {busy === "start" ? "Starting…" : "Start exam in fullscreen"}
          </Button>
        </Step>
      </ol>
      <div className="mt-4">
        <FormMessage>{error}</FormMessage>
      </div>
      <div className="mt-6">
        <Link href={DASHBOARD} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Dashboard
        </Link>
      </div>
    </PageShell>
  );
}

function Step({ done, icon, title, children }: { done: boolean; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className={cn("flex flex-col gap-3 rounded-lg border p-4", done ? "border-green-300 bg-green-50/60 dark:border-green-500/30 dark:bg-green-500/5" : "border-slate-200 dark:border-white/10")}>
      <p className="flex items-center gap-2 text-sm font-bold text-navy dark:text-white">
        {done ? <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" /> : icon} {title}
      </p>
      {children}
    </li>
  );
}

function Taking({ attempt, media, onResult, onEnded }: { attempt: SkillAttempt; media: Media; onResult: (r: SkillExamResult) => void; onEnded: (reason?: SkillTerminationReason) => void }) {
  const [answers, setAnswers] = React.useState<Record<string, string>>(attempt.answers);
  const [index, setIndex] = React.useState(0);
  const [now, setNow] = React.useState(() => Date.now());
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [offline, setOffline] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [faceWarnings, setFaceWarnings] = React.useState(0);
  const [faceAlert, setFaceAlert] = React.useState<string | null>(null);
  const finished = React.useRef(false);
  const pending = React.useRef(new Map<string, string>());
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const deadline = React.useMemo(() => new Date(attempt.deadlineAt).getTime(), [attempt.deadlineAt]);
  const remaining = Math.max(0, Math.floor((deadline - now) / 1000));
  const question = attempt.questions[index]!;
  const answered = attempt.questions.filter((q) => answers[q.id]).length;
  const unanswered = attempt.questions.length - answered;

  const release = React.useCallback(() => {
    proctoring.stop(media.camera);
    proctoring.stop(media.screen);
    void proctoring.exitFullscreen();
  }, [media]);

  /** The candidate left the exam: end it on the server and stop here. */
  const end = React.useCallback(
    (reason: SkillTerminationReason) => {
      if (finished.current) return;
      finished.current = true;
      void skillExamApi.terminate(attempt.id, reason).catch(() => undefined);
      release();
      onEnded(reason);
    },
    [attempt.id, onEnded, release],
  );

  const isNetwork = (err: unknown) => err instanceof ApiError && err.code === "NETWORK_ERROR";

  /** Sends answers that could not be saved (offline); the server's deadline keeps the timer honest. */
  const flush = React.useCallback(async () => {
    for (const [questionId, optionId] of [...pending.current]) {
      try {
        await skillExamApi.answer(attempt.id, questionId, optionId, attempt.sessionKey);
        if (pending.current.get(questionId) === optionId) pending.current.delete(questionId);
      } catch (err) {
        if (isNetwork(err)) {
          setOffline(true);
          return false;
        }
        if (err instanceof ApiError && err.code === "EXAM_ENDED") {
          end("left_exam");
          return false;
        }
        pending.current.delete(questionId);
      }
    }
    setOffline(false);
    return true;
  }, [attempt.id, attempt.sessionKey, end]);

  const submit = React.useCallback(async () => {
    if (finished.current) return;
    setBusy(true);
    setError(null);
    await flush();
    try {
      finished.current = true;
      const result = await skillExamApi.submit(attempt.id, attempt.sessionKey);
      release();
      onResult(result);
    } catch (err) {
      finished.current = false;
      setBusy(false);
      if (isNetwork(err)) {
        setOffline(true);
        setError("No internet connection. Stay on this page; we will submit when you are back online.");
      } else if (err instanceof ApiError && err.code === "EXAM_ENDED") {
        end("left_exam");
      } else setError(errorMessage(err));
    }
  }, [attempt.id, attempt.sessionKey, flush, onResult, release, end]);

  // Timer: when the time is up, submit what has been answered.
  React.useEffect(() => {
    const timer = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= deadline) void submit();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deadline, submit]);

  // Reconnect: retry unsaved answers when the browser is back online, and every few seconds while offline.
  React.useEffect(() => {
    const retry = () => void flush();
    window.addEventListener("online", retry);
    const timer = window.setInterval(() => {
      if (pending.current.size > 0) retry();
    }, RETRY_MS);
    return () => {
      window.removeEventListener("online", retry);
      window.clearInterval(timer);
    };
  }, [flush]);

  // Heartbeat: tells the server this window is still open. If the exam was ended meanwhile (for example after
  // 5 minutes without a connection), show that at once.
  React.useEffect(() => {
    const beat = () => {
      if (finished.current) return;
      skillExamApi.heartbeat(attempt.id, attempt.sessionKey).catch((err: unknown) => {
        if (finished.current || !(err instanceof ApiError)) return;
        if (err.code === "EXAM_ENDED" || err.code === "ATTEMPT_CLOSED") {
          finished.current = true;
          release();
          // The server already closed it: show its outcome (scored if time was up, otherwise ended).
          skillExamApi
            .submit(attempt.id, attempt.sessionKey)
            .then(onResult)
            .catch(() => onEnded("connection_lost"));
        }
      });
    };
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    window.addEventListener("online", beat);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", beat);
    };
  }, [attempt.id, attempt.sessionKey, onEnded, onResult, release]);

  // Leaving the exam ends it: other tab or app, fullscreen exit, screen share or camera stopped, page closed.
  React.useEffect(() => {
    const onVisibility = () => document.visibilityState === "hidden" && end("tab_hidden");
    const onFullscreen = () => !proctoring.isFullscreen() && end("fullscreen_exit");
    const onPageHide = () => end("left_exam");
    const screenTrack = media.screen.getVideoTracks()[0];
    const cameraTrack = media.camera.getVideoTracks()[0];
    const onScreenEnded = () => end("screen_share_stopped");
    const onCameraEnded = () => end("camera_lost");
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("pagehide", onPageHide);
    screenTrack?.addEventListener("ended", onScreenEnded);
    cameraTrack?.addEventListener("ended", onCameraEnded);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.removeEventListener("pagehide", onPageHide);
      screenTrack?.removeEventListener("ended", onScreenEnded);
      cameraTrack?.removeEventListener("ended", onCameraEnded);
    };
  }, [end, media]);

  // Face checks on this device every few seconds; 3 warnings end the exam.
  React.useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.srcObject = media.camera;
      void video.play?.()?.catch(() => undefined);
    }
    let warnings = 0;
    const timer = window.setInterval(async () => {
      if (finished.current || !video || video.readyState < 2) return;
      try {
        const signal = await media.detector.check(video);
        if (!signal) return;
        warnings += 1;
        setFaceWarnings(warnings);
        setFaceAlert(signal === "NO_FACE" ? "We cannot see your face. Look at the screen." : "More than one person is in view. Only you may be in front of the camera.");
        if (warnings >= MAX_FACE_WARNINGS) end("face_violations");
      } catch {
        /* a failed sample must not stop the exam */
      }
    }, FACE_CHECK_MS);
    return () => window.clearInterval(timer);
  }, [end, media]);

  async function choose(optionId: string) {
    setAnswers((a) => ({ ...a, [question.id]: optionId }));
    setError(null);
    pending.current.set(question.id, optionId);
    await flush();
  }

  return (
    <PageShell eyebrow="Exam in progress" title={attempt.title} width="max-w-4xl">
      <video ref={videoRef} muted playsInline aria-label="Your camera" className="fixed bottom-4 right-4 z-40 h-24 w-32 rounded-lg border-2 border-white object-cover shadow-lg" />
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="font-semibold text-navy dark:text-white">
          Question {index + 1} of {attempt.questions.length} · {answered} answered
        </p>
        <p className={cn("inline-flex items-center gap-1.5 font-bold tabular-nums", remaining <= 60 ? "text-red-600 dark:text-red-400" : "text-primary-blue dark:text-bright-blue")} role="timer" aria-label="Time left">
          <Clock className="h-4 w-4" aria-hidden="true" /> {formatClock(remaining)}
        </p>
      </div>

      {offline ? (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" /> Reconnecting… Stay on this page. Your answers are kept and the timer keeps running.
        </p>
      ) : null}
      {faceAlert ? (
        <p role="alert" className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" /> Warning {faceWarnings} of {MAX_FACE_WARNINGS}: {faceAlert}
        </p>
      ) : null}

      <fieldset className="mt-6">
        <legend className="text-base font-semibold leading-relaxed text-navy dark:text-white">{question.prompt}</legend>
        <div className="mt-4 space-y-2.5">
          {question.options.map((option) => {
            const selected = answers[question.id] === option.id;
            return (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-colors",
                  selected ? "border-bright-blue bg-light-blue/60 text-navy dark:bg-bright-blue/10 dark:text-white" : "border-slate-200 text-ink hover:bg-light-blue/30 dark:border-white/10 dark:text-slate-200",
                )}
              >
                <input type="radio" name={`q-${question.id}`} className="mt-0.5" checked={selected} onChange={() => void choose(option.id)} disabled={busy} />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => setIndex((i) => i - 1)} disabled={index === 0 || busy}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Previous
        </Button>
        {index < attempt.questions.length - 1 ? (
          <Button onClick={() => setIndex((i) => i + 1)} disabled={busy}>
            Next <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button onClick={() => (unanswered > 0 ? setConfirming(true) : void submit())} loading={busy}>
            Submit exam
          </Button>
        )}
      </div>

      <nav aria-label="Questions" className="mt-6 flex flex-wrap gap-2">
        {attempt.questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to question ${i + 1}${answers[q.id] ? " (answered)" : ""}`}
            aria-current={i === index ? "true" : undefined}
            className={cn(
              "h-9 w-9 rounded-md border text-xs font-bold",
              i === index ? "border-bright-blue bg-bright-blue text-white" : answers[q.id] ? "border-green-300 bg-green-50 text-green-800 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-300" : "border-slate-200 text-muted dark:border-white/10",
            )}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      <div className="mt-4">
        <FormMessage>{error}</FormMessage>
      </div>

      {confirming ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-5">
          <div role="alertdialog" aria-modal="true" aria-labelledby="submit-title" className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl dark:bg-dark-surface">
            <h2 id="submit-title" className="text-lg font-bold text-navy dark:text-white">
              Submit with {unanswered} unanswered?
            </h2>
            <p className="mt-2 text-sm text-muted dark:text-slate-400">Unanswered questions score zero. This exam can be taken only once.</p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Keep answering
              </Button>
              <Button
                onClick={() => {
                  setConfirming(false);
                  void submit();
                }}
              >
                Submit now
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

/** Qualified or Disqualified, never a score (QA items 9, 10, 12). */
function Result({ result }: { result: SkillExamResult }) {
  const qualified = result.outcome === "qualified";
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const [given, setGiven] = React.useState(result.feedbackGiven);
  return (
    <PageShell title={qualified ? "Qualified" : "Disqualified"} intro={result.title} width="max-w-2xl">
      <div className="text-center" role="status">
        {qualified ? (
          <>
            <PartyPopper className="mx-auto h-16 w-16 text-amber-500" aria-hidden="true" />
            <p className="mt-4 text-2xl font-extrabold text-navy dark:text-white">Congratulations!</p>
            <p className="mt-2 text-sm text-ink dark:text-slate-200">You have qualified. Please visit our branch for further process on your placement offer.</p>
          </>
        ) : (
          <>
            <MessageSquare className="mx-auto h-14 w-14 text-primary-blue dark:text-bright-blue" aria-hidden="true" />
            <p className="mt-4 text-xl font-bold text-navy dark:text-white">Don&apos;t worry.</p>
            <p className="mt-2 text-sm text-ink dark:text-slate-200">Contact our support team for further process.</p>
          </>
        )}
        <p className="mt-3 text-xs text-muted dark:text-slate-400">We have also emailed you this result.</p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {!given ? (
          <Button onClick={() => setFeedbackOpen(true)} variant={qualified ? "outline" : "primary"}>
            Feedback
          </Button>
        ) : null}
        {qualified ? null : <ContactMenu label="Contact us" className={buttonVariants({ variant: "outline" })} />}
        <Link href={DASHBOARD} className={buttonVariants({ variant: qualified ? "primary" : "outline" })}>
          Back to Dashboard
        </Link>
      </div>
      {feedbackOpen && !given ? <FeedbackForm attemptId={result.attemptId} onDone={() => setGiven(true)} /> : null}
      {given ? <p className="mt-6 text-center text-sm text-green-700 dark:text-green-400">Thank you for your feedback.</p> : null}
    </PageShell>
  );
}

function FeedbackForm({ attemptId, onDone }: { attemptId: string; onDone: () => void }) {
  const [rating, setRating] = React.useState(0);
  const [comments, setComments] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) return setError("Choose a rating from 1 to 5.");
    setBusy(true);
    setError(null);
    try {
      await skillExamApi.feedback(attemptId, rating, comments.trim());
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.code === "FEEDBACK_EXISTS") onDone();
      else setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={(e) => void send(e)} className="mt-6 rounded-xl2 border border-slate-100 p-5 dark:border-white/10" aria-label="Exam feedback">
      <fieldset>
        <legend className="text-sm font-bold text-navy dark:text-white">How was your exam?</legend>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={cn("grid h-10 w-10 cursor-pointer place-items-center rounded-md border text-sm font-bold", rating === n ? "border-bright-blue bg-bright-blue text-white" : "border-slate-200 text-navy dark:border-white/10 dark:text-white")}>
              <input type="radio" name="rating" value={n} className="sr-only" checked={rating === n} onChange={() => setRating(n)} aria-label={`${n} out of 5`} />
              {n}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 block text-sm font-semibold text-navy dark:text-white">
        Comments (optional)
        <textarea value={comments} onChange={(e) => setComments(e.target.value)} maxLength={2000} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm font-normal dark:border-white/10 dark:bg-dark-surface" />
      </label>
      <FormMessage>{error}</FormMessage>
      <Button type="submit" className="mt-3" loading={busy}>
        {busy ? "Sending…" : "Send feedback"}
      </Button>
    </form>
  );
}
