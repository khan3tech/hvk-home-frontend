import type { LearningCourse, LearningTrack, LessonProgressResult, PlaybackLink } from "@/types/api";
import { apiFetch } from "./client";

/** Course videos for signed-in users. */
export const learningApi = {
  /** Courses in display order, each with its lessons and this user's progress; only a track's courses when `trackId` is given. */
  courses: (trackId?: string) => apiFetch<LearningCourse[]>("/courses", { query: { track: trackId } }),
  /** Learning tracks with this user's progress. Empty until tracks are set up. */
  tracks: () => apiFetch<LearningTrack[]>("/tracks"),
  /** Remembers the chosen track (one at a time). */
  selectTrack: (trackId: string) => apiFetch<{ trackId: string; selected: true }>(`/tracks/${encodeURIComponent(trackId)}/select`, { method: "PUT" }),
  /** A short-lived signed link for one lesson's video; ask again when it expires. */
  play: (lessonId: string) => apiFetch<PlaybackLink>(`/lessons/${encodeURIComponent(lessonId)}/play`, { method: "POST" }),
  /** Idempotent: where the viewer stopped, and whether the lesson is finished. */
  saveProgress: (lessonId: string, body: { positionSeconds: number; completed?: boolean }) =>
    apiFetch<LessonProgressResult>(`/lessons/${encodeURIComponent(lessonId)}/progress`, { method: "PUT", body }),
};
