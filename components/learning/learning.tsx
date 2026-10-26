"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { learningApi } from "@/lib/api/learning";
import { portalApi } from "@/lib/api/portal";
import { errorMessage } from "@/lib/api/client";
import { STEP_ROUTE } from "@/lib/journey";
import { allCompleted, applyProgress, findLesson, neighbours } from "@/lib/learning";
import { FormMessage } from "@/components/portal/form-field";
import { PageShell } from "@/components/portal/page-shell";
import type { LearningCourse, LessonProgressResult } from "@/types/api";
import { CourseList } from "./course-list";
import { CourseSidebar } from "./course-sidebar";
import { LessonPlayer } from "./lesson-player";

/** The learning step: a course list, then a player with a content sidebar. Continuing to payment is always possible. */
export function Learning() {
  const router = useRouter();
  const [courses, setCourses] = React.useState<LearningCourse[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    learningApi
      .courses()
      .then((list) => {
        if (cancelled) return;
        setCourses(list);
        const wanted = new URLSearchParams(window.location.search).get("lesson");
        if (findLesson(list, wanted)) setActiveId(wanted);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const active = courses && activeId ? findLesson(courses, activeId) : null;
  const near = courses && active ? neighbours(courses, active.lesson.id) : null;

  return (
    <PageShell
      eyebrow="Step 2 of 6"
      title={active ? active.lesson.title : "Learn before you start"}
      intro={
        active
          ? `${active.course.title} · ${active.lesson.sectionTitle}`
          : "Watch the courses in any order, or skip ahead. You can continue to payment at any time."
      }
      width="max-w-6xl"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {active ? (
          <Button variant="ghost" size="sm" onClick={() => select(null)}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All courses
          </Button>
        ) : (
          <span />
        )}
        <Button onClick={() => void proceed()} disabled={busy || (courses === null && !loadError)}>
          {busy ? "Continuing..." : finished ? "Continue to payment" : "Skip to payment"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <FormMessage>{error}</FormMessage>

      {loadError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {loadError} You can still continue to payment.
        </p>
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
