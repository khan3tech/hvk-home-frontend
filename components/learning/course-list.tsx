import { Button } from "@/components/ui/button";
import { courseStatus, formatTotal, resumeLesson } from "@/lib/learning";
import type { LearningCourse } from "@/types/api";

const ACTION = { not_started: "Start", in_progress: "Resume", completed: "Watch again" } as const;

export function CourseList({ courses, onOpen }: { courses: LearningCourse[]; onOpen: (lessonId: string) => void }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {courses.map((course) => {
        const first = resumeLesson(course);
        const percent = course.lessonCount > 0 ? Math.round((course.completedCount / course.lessonCount) * 100) : 0;
        const action = ACTION[courseStatus(course)];
        return (
          <li key={course.id} className="flex flex-col rounded-lg border border-slate-100 p-4 dark:border-white/10">
            <h2 className="text-base font-bold text-navy dark:text-white">{course.title}</h2>
            {course.description ? <p className="mt-1 text-sm text-muted dark:text-slate-400">{course.description}</p> : null}
            <p className="mt-2 text-xs text-muted dark:text-slate-400">
              {course.lessonCount} lessons · {formatTotal(course.durationSeconds)}
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
            <div className="mt-4">
              <Button size="sm" disabled={!first} onClick={() => first && onOpen(first.id)} aria-label={`${action} ${course.title}`}>
                {action}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
