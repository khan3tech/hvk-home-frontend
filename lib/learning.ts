import type { LearningCourse, LearningLesson, LessonProgressResult } from "@/types/api";

/** A lesson together with the course it belongs to. */
export interface LessonRef {
  lesson: LearningLesson;
  course: LearningCourse;
}

export interface LessonSection {
  /** Stable key: sections are identified by their position and title. */
  key: string;
  title: string;
  lessons: LearningLesson[];
}

/** "4:32" or "1:02:05". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** "3h 20m", "45m" or "under a minute". */
export function formatTotal(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 1) return "under a minute";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

/** Every lesson in viewing order: courses by position (as returned), then sections, then lessons. */
export function flatLessons(courses: LearningCourse[]): LessonRef[] {
  return courses.flatMap((course) => course.lessons.map((lesson) => ({ lesson, course })));
}

export function findLesson(courses: LearningCourse[], lessonId: string | null): LessonRef | null {
  if (!lessonId) return null;
  return flatLessons(courses).find((ref) => ref.lesson.id === lessonId) ?? null;
}

/** The lesson before and after this one; "next" continues into the following course. */
export function neighbours(courses: LearningCourse[], lessonId: string): { previous: LessonRef | null; next: LessonRef | null } {
  const all = flatLessons(courses);
  const index = all.findIndex((ref) => ref.lesson.id === lessonId);
  if (index < 0) return { previous: null, next: null };
  return { previous: all[index - 1] ?? null, next: all[index + 1] ?? null };
}

/** Where "Start / Resume" lands: the first unfinished lesson of the course, else its first lesson. */
export function resumeLesson(course: LearningCourse): LearningLesson | null {
  return course.lessons.find((l) => !l.completed) ?? course.lessons[0] ?? null;
}

export type CourseStatus = "not_started" | "in_progress" | "completed";

export function courseStatus(course: LearningCourse): CourseStatus {
  if (course.lessonCount > 0 && course.completedCount >= course.lessonCount) return "completed";
  const started = course.completedCount > 0 || course.lessons.some((l) => l.positionSeconds > 0);
  return started ? "in_progress" : "not_started";
}

/** Lessons grouped under their section heading, in order. */
export function sectionsOf(course: LearningCourse): LessonSection[] {
  const sections: LessonSection[] = [];
  for (const lesson of course.lessons) {
    const key = `${lesson.sectionPosition}:${lesson.sectionTitle}`;
    const last = sections[sections.length - 1];
    if (last && last.key === key) last.lessons.push(lesson);
    else sections.push({ key, title: lesson.sectionTitle, lessons: [lesson] });
  }
  return sections;
}

/** True once there is content and every lesson of every course is finished. */
export function allCompleted(courses: LearningCourse[]): boolean {
  const lessons = flatLessons(courses);
  return lessons.length > 0 && lessons.every((ref) => ref.lesson.completed);
}

/** A finished (or nearly finished) lesson starts over; otherwise it resumes where the viewer stopped. */
export function startPosition(lesson: LearningLesson): number {
  if (lesson.completed) return 0;
  if (lesson.durationSeconds > 0 && lesson.positionSeconds >= lesson.durationSeconds * 0.95) return 0;
  return lesson.positionSeconds;
}

/** Applies a saved-progress response to the course list without mutating it. */
export function applyProgress(courses: LearningCourse[], progress: LessonProgressResult): LearningCourse[] {
  return courses.map((course) => {
    if (!course.lessons.some((l) => l.id === progress.lessonId)) return course;
    const lessons = course.lessons.map((l) =>
      l.id === progress.lessonId ? { ...l, positionSeconds: progress.positionSeconds, completed: l.completed || progress.completed } : l,
    );
    return { ...course, lessons, completedCount: lessons.filter((l) => l.completed).length };
  });
}
