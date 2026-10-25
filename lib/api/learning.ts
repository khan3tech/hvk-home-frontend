import type { LearningCourse, LessonProgressResult, PlaybackLink } from "@/types/api";
import { apiFetch } from "./client";

/** Course videos for signed-in users. */
export const learningApi = {
  /** Published courses in display order, each with its lessons and this user's progress. */
  courses: () => apiFetch<LearningCourse[]>("/courses"),
  /** A short-lived signed link for one lesson's video; ask again when it expires. */
  play: (lessonId: string) => apiFetch<PlaybackLink>(`/lessons/${encodeURIComponent(lessonId)}/play`, { method: "POST" }),
  /** Idempotent: where the viewer stopped, and whether the lesson is finished. */
  saveProgress: (lessonId: string, body: { positionSeconds: number; completed?: boolean }) =>
    apiFetch<LessonProgressResult>(`/lessons/${encodeURIComponent(lessonId)}/progress`, { method: "PUT", body }),
};
