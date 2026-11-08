"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock, Shuffle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { learningApi } from "@/lib/api/learning";
import { skillExamApi } from "@/lib/api/skill-exams";
import { portalApi } from "@/lib/api/portal";
import { errorMessage } from "@/lib/api/client";
import { isUnlocked, STEP_ROUTE } from "@/lib/journey";
import { allCompleted, applyProgress, findLesson, neighbours, openableCourses } from "@/lib/learning";
import { usePaymentConfig } from "@/lib/use-payment-config";
import { FormMessage } from "@/components/portal/form-field";
import { PageShell } from "@/components/portal/page-shell";
import { useJourney } from "@/components/portal/portal-gate";
import type { LearningCourse, LearningTrack, LessonProgressResult, SkillExam } from "@/types/api";
import { CourseList } from "./course-list";
import { CourseSidebar } from "./course-sidebar";
import { DomainExamCard } from "./skill-exam-cards";
import { LessonPlayer } from "./lesson-player";
import { TrackList } from "./track-list";

/**
 * The learning step. With tracks set up: choose a track, then see only its courses and a player with a
 * content sidebar. Without tracks: every course. Continuing to payment is always possible.
 */
export function Learning({ hub = false }: { hub?: boolean } = {}) {
  const router = useRouter();
  const { status } = useJourney();
  const { config } = usePaymentConfig();
  // Manual-payment mode, payment not approved yet: only the first video of each course plays; the exam is locked.
  const gated = config?.mode === "manual" && !isUnlocked(status.step);
  const [tracks, setTracks] = React.useState<LearningTrack[] | null>(null);
  const [courses, setCourses] = React.useState<LearningCourse[] | null>(null);
  const [exams, setExams] = React.useState<SkillExam[]>([]);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [choosing, setChoosing] = React.useState(false);
  const [openingId, setOpeningId] = React.useState<string | null>(null);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Course and domain exams (spec 007); the page works without them if the call fails.
  React.useEffect(() => {
    let cancelled = false;
    skillExamApi
      .list()
      .then((list) => !cancelled && setExams(list))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  /** Shows `list`, opening the lesson named in the link if it is in it. */
  const show = React.useCallback((list: LearningCourse[]) => {
    setCourses(list);
    const wanted = new URLSearchParams(window.location.search).get("lesson");
    if (findLesson(list, wanted)) setActiveId(wanted);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // An API without tracks (not deployed yet, or none set up) just shows every course.
        const list = await learningApi.tracks().catch(() => [] as LearningTrack[]);
        if (cancelled) return;
        setTracks(list);
        const chosen = list.find((t) => t.selected && t.available);
        if (list.length === 0) show(await learningApi.courses());
        else if (chosen) show(await learningApi.courses(chosen.id));
        else setChoosing(true);
      } catch (err) {
        if (!cancelled) setLoadError(errorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [show]);

  const select = React.useCallback((lessonId: string | null) => {
    setActiveId(lessonId);
    const url = new URL(window.location.href);
    if (lessonId) url.searchParams.set("lesson", lessonId);
    else url.searchParams.delete("lesson");
    window.history.replaceState(null, "", url);
  }, []);

  const onProgress = React.useCallback((progress: LessonProgressResult) => {
    setCourses((prev) => (prev ? applyProgress(prev, progress) : prev));
  }, []);

  async function choose(track: LearningTrack) {
    setError(null);
    setOpeningId(track.id);
    try {
      await learningApi.selectTrack(track.id);
      const list = await learningApi.courses(track.id);
      setTracks((prev) => (prev ? prev.map((t) => ({ ...t, selected: t.id === track.id })) : prev));
      setActiveId(null);
      setCourses(list);
      setChoosing(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setOpeningId(null);
    }
  }

  const finished = courses !== null && allCompleted(courses);

  async function proceed() {
    setError(null);
    setBusy(true);
    try {
      const status = finished ? await portalApi.completeDemo() : await portalApi.skipDemo();
      router.push(STEP_ROUTE[status.step]);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  const hasTracks = tracks !== null && tracks.length > 0;
  const current = tracks?.find((t) => t.selected) ?? null;
  const openable = courses ? openableCourses(courses, gated) : null;
  const active = openable && activeId ? findLesson(openable, activeId) : null;
  const near = openable && active ? neighbours(openable, active.lesson.id) : null;
  const showChooser = hasTracks && choosing;
  const examsByCourse = React.useMemo(() => new Map(exams.filter((e) => e.scope === "course" && e.courseId).map((e) => [e.courseId!, e])), [exams]);
  const domainExams = exams.filter((e) => e.scope === "domain");
  // The chooser offers every domain exam; a chosen pathway offers the exam of its own domain.
  const shownDomainExams = showChooser ? domainExams : current && !active ? domainExams.filter((e) => e.domain === current.domain) : [];
  const loaded = loadError !== null || showChooser || courses !== null;

  const title = showChooser ? "Choose your learning path" : active ? active.lesson.title : current ? current.title : hub ? "My learning" : "Learn before you start";
  const later = hub ? "" : " You can continue to payment at any time.";
  const previewNote = gated ? " Watch the first video of every course for free; the rest and your exam unlock after our team approves your payment." : "";
  const intro = showChooser
    ? `Pick the career track you want to follow. You will see only its courses, and you can change track later.${later}`
    : active
      ? `${active.course.title} · ${active.lesson.sectionTitle}`
      : current
        ? (current.description || `Watch the courses of your track in any order.${later}`) + previewNote
        : `Watch the courses in any order.${later}${previewNote}`;

  return (
    <PageShell eyebrow={hub ? "My learning" : "Step 2 of 6"} title={title} intro={intro} width="max-w-6xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {showChooser ? (
          current ? (
            <Button variant="ghost" size="sm" onClick={() => setChoosing(false)}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to {current.title}
            </Button>
          ) : (
            <span />
          )
        ) : active ? (
          <Button variant="ghost" size="sm" onClick={() => select(null)}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All courses
          </Button>
        ) : hasTracks ? (
          <Button variant="ghost" size="sm" onClick={() => setChoosing(true)}>
            <Shuffle className="h-4 w-4" aria-hidden="true" />
            Change track
          </Button>
        ) : (
          <span />
        )}
        {hub ? (
          <div className="flex flex-wrap items-center gap-2">
            {isUnlocked(status.step) ? (
              <Link href="/exam" className={buttonVariants({ variant: "primary", size: "sm" })}>
                Go to exam <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <Button size="sm" disabled title="Unlocks after your payment is approved">
                <Lock className="h-4 w-4" aria-hidden="true" /> Go to exam
              </Button>
            )}
            <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Back to dashboard
            </Link>
          </div>
        ) : (
          <Button onClick={() => void proceed()} disabled={busy || !loaded}>
            {busy ? "Continuing..." : finished ? "Continue to payment" : "Skip to payment"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      <FormMessage>{error}</FormMessage>

      {shownDomainExams.length > 0 ? (
        <div className="mb-6 space-y-3">
          {shownDomainExams.map((exam) => (
            <DomainExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      ) : null}

      {loadError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {loadError} You can still continue to payment.
        </p>
      ) : showChooser && tracks ? (
        <TrackList tracks={tracks} busyId={openingId} onChoose={(track) => void choose(track)} />
      ) : courses === null ? (
        <p className="text-sm text-muted dark:text-slate-400">Loading courses...</p>
      ) : courses.length === 0 ? (
        <p className="rounded-lg bg-light-blue/50 p-6 text-sm text-muted dark:bg-dark-surface-alt dark:text-slate-400">
          There are no courses yet. You can continue to the next step.
        </p>
      ) : active && near ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <LessonPlayer
            key={active.lesson.id}
            lesson={active.lesson}
            hasPrevious={near.previous !== null}
            hasNext={near.next !== null}
            onPrevious={() => near.previous && select(near.previous.lesson.id)}
            onNext={() => near.next && select(near.next.lesson.id)}
            onProgress={onProgress}
          />
          <CourseSidebar courses={courses} activeLessonId={active.lesson.id} onSelect={select} gated={gated} />
        </div>
      ) : (
        <CourseList courses={courses} onOpen={select} gated={gated} exams={examsByCourse} />
      )}
    </PageShell>
  );
}
