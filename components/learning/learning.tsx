"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { learningApi } from "@/lib/api/learning";
import { portalApi } from "@/lib/api/portal";
import { errorMessage } from "@/lib/api/client";
import { STEP_ROUTE } from "@/lib/journey";
import { allCompleted, applyProgress, findLesson, neighbours } from "@/lib/learning";
import { FormMessage } from "@/components/portal/form-field";
import { PageShell } from "@/components/portal/page-shell";
import type { LearningCourse, LearningTrack, LessonProgressResult } from "@/types/api";
import { CourseList } from "./course-list";
import { CourseSidebar } from "./course-sidebar";
import { LessonPlayer } from "./lesson-player";
import { TrackList } from "./track-list";

/**
 * The learning step. With tracks set up: choose a track, then see only its courses and a player with a
 * content sidebar. Without tracks: every course. Continuing to payment is always possible.
 */
export function Learning() {
  const router = useRouter();
  const [tracks, setTracks] = React.useState<LearningTrack[] | null>(null);
  const [courses, setCourses] = React.useState<LearningCourse[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [choosing, setChoosing] = React.useState(false);
  const [openingId, setOpeningId] = React.useState<string | null>(null);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
  const active = courses && activeId ? findLesson(courses, activeId) : null;
  const near = courses && active ? neighbours(courses, active.lesson.id) : null;
  const showChooser = hasTracks && choosing;
  const loaded = loadError !== null || showChooser || courses !== null;

  const title = showChooser ? "Choose your learning path" : active ? active.lesson.title : current ? current.title : "Learn before you start";
  const intro = showChooser
    ? "Pick the career track you want to follow. You will see only its courses, and you can change track later. You can continue to payment at any time."
    : active
      ? `${active.course.title} · ${active.lesson.sectionTitle}`
      : current
        ? current.description || "Watch the courses of your track in any order, or skip ahead. You can continue to payment at any time."
        : "Watch the courses in any order, or skip ahead. You can continue to payment at any time.";

  return (
    <PageShell eyebrow="Step 2 of 6" title={title} intro={intro} width="max-w-6xl">
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
        <Button onClick={() => void proceed()} disabled={busy || !loaded}>
          {busy ? "Continuing..." : finished ? "Continue to payment" : "Skip to payment"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <FormMessage>{error}</FormMessage>

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
          <CourseSidebar courses={courses} activeLessonId={active.lesson.id} onSelect={select} />
        </div>
      ) : (
        <CourseList courses={courses} onOpen={select} />
      )}
    </PageShell>
  );
}
