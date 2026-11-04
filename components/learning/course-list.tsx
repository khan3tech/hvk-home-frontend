import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { courseStatus, formatTotal, resumeLesson } from "@/lib/learning";
import type { LearningCourse } from "@/types/api";

const ACTION = { coming_soon: "Coming soon", not_started: "Start", in_progress: "Resume", completed: "Watch again" } as const;

export function CourseList({ courses, onOpen, gated = false }: { courses: LearningCourse[]; onOpen: (lessonId: string) => void; gated?: boolean }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {courses.map((course) => {
        // Before payment approval only the first video plays.
        const first = gated ? (course.lessons.find((l) => l.preview) ?? null) : resumeLesson(course);
        const percent = course.lessonCount > 0 ? Math.round((course.completedCount / course.lessonCount) * 100) : 0;
        const action = ACTION[courseStatus(course)];
        const previewing = gated && !course.comingSoon;
        return (
          <li key={course.id} className="flex flex-col rounded-lg border border-slate-100 p-4 dark:border-white/10">
            <h2 className="flex items-center justify-between gap-2 text-base font-bold text-navy dark:text-white">
              {course.title}
              {course.comingSoon ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">Coming soon</span>
              ) : null}
            </h2>
            {course.description ? <p className="mt-1 text-sm text-muted dark:text-slate-400">{course.description}</p> : null}
            {course.comingSoon ? (
              <p className="mt-3 flex-1 text-sm text-muted dark:text-slate-400">The videos for this course are on their way.</p>
            ) : (
              <>
                <p className="mt-2 text-xs text-muted dark:text-slate-400">
                  {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"} · {formatTotal(course.durationSeconds)}
                </p>
                <div
                  role="progressbar"
                  aria-label={`${course.title} progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
                >
                  <div className="h-full bg-bright-blue" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted dark:text-slate-400">
                  {course.completedCount} of {course.lessonCount} watched
                </p>
                {gated ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    Free preview: video 1. The rest unlocks after payment approval.
                  </p>
                ) : null}
              </>
            )}
            <div className="mt-4">
              <Button size="sm" disabled={!first} onClick={() => first && onOpen(first.id)} aria-label={`${previewing ? "Watch free preview of" : action} ${course.title}`}>
                {previewing ? "Watch free preview" : action}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
