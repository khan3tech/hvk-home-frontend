"use client";

import * as React from "react";
import { Check, ChevronDown, Circle, Play } from "lucide-react";
import { formatDuration, sectionsOf } from "@/lib/learning";
import type { LearningCourse } from "@/types/api";

/** Every course → section → lesson. Any lesson can be opened at any time. */
export function CourseSidebar({
  courses,
  activeLessonId,
  onSelect,
}: {
  courses: LearningCourse[];
  activeLessonId: string;
  onSelect: (lessonId: string) => void;
}) {
  const activeCourseId = courses.find((c) => c.lessons.some((l) => l.id === activeLessonId))?.id;
  const [open, setOpen] = React.useState<Set<string>>(() => new Set(activeCourseId ? [activeCourseId] : []));

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <nav aria-label="Course content" className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      <ul className="space-y-2">
        {courses.map((course) => {
          const expanded = open.has(course.id);
          return (
            <li key={course.id} className="rounded-lg border border-slate-100 dark:border-white/10">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => toggle(course.id)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-bold text-navy dark:text-white"
              >
                <span>
                  {course.title}
                  <span className="block text-xs font-normal text-muted dark:text-slate-400">
                    {course.completedCount} of {course.lessonCount} done
                  </span>
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {expanded
                ? sectionsOf(course).map((section) => (
                    <div key={section.key} className="border-t border-slate-100 dark:border-white/10">
                      <p className="bg-light-blue/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted dark:bg-dark-surface-alt dark:text-slate-400">
                        {section.title}
                      </p>
                      <ul>
                        {section.lessons.map((lesson) => {
                          const current = lesson.id === activeLessonId;
                          return (
                            <li key={lesson.id}>
                              <button
                                type="button"
                                aria-current={current ? "true" : undefined}
                                onClick={() => onSelect(lesson.id)}
                                className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm ${
                                  current
                                    ? "bg-light-blue font-semibold text-primary-blue dark:bg-white/10 dark:text-bright-blue"
                                    : "text-navy hover:bg-light-blue/60 dark:text-slate-200 dark:hover:bg-white/5"
                                }`}
                              >
                                {current ? (
                                  <Play className="mt-0.5 h-4 w-4 shrink-0" aria-label="Playing" />
                                ) : lesson.completed ? (
                                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-label="Watched" />
                                ) : (
                                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-label="Not started" />
                                )}
                                <span className="flex-1">{lesson.title}</span>
                                <span className="text-xs text-muted dark:text-slate-400">{formatDuration(lesson.durationSeconds)}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))
                : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
