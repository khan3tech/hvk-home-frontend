"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { learningApi } from "@/lib/api/learning";
import { errorMessage } from "@/lib/api/client";
import { startPosition } from "@/lib/learning";
import type { LearningLesson, LessonProgressResult } from "@/types/api";

const SAVE_EVERY_MS = 10_000;
const MAX_LINK_REFRESHES = 3;

/**
 * Plays one lesson. Mount it with `key={lesson.id}` so every lesson starts from clean state.
 * Saves progress while playing, on pause, on leaving and when the video ends.
 */
export function LessonPlayer({
  lesson,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onProgress,
}: {
  lesson: LearningLesson;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onProgress: (progress: LessonProgressResult) => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [src, setSrc] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [initialPosition] = React.useState(() => startPosition(lesson));
  const resumeAt = React.useRef(initialPosition);
  const refreshes = React.useRef(0);
  const onProgressRef = React.useRef(onProgress);
  React.useEffect(() => {
    onProgressRef.current = onProgress;
  });

  const lessonId = lesson.id;

  const loadLink = React.useCallback(async () => {
    try {
      const link = await learningApi.play(lessonId);
      setError(null);
      setSrc(link.url);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [lessonId]);

  React.useEffect(() => {
    let cancelled = false;
    learningApi
      .play(lessonId)
      .then((link) => {
        if (!cancelled) setSrc(link.url);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const save = React.useCallback(
    (completed = false) => {
      const video = videoRef.current;
      if (!video || (!completed && video.currentTime <= 0)) return;
      const positionSeconds = Math.floor(video.currentTime);
      learningApi
        .saveProgress(lessonId, completed ? { positionSeconds, completed: true } : { positionSeconds })
        .then((result) => onProgressRef.current(result))
        .catch(() => undefined); // progress is best effort; the next save retries
    },
    [lessonId],
  );

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) save();
    }, SAVE_EVERY_MS);
    const onHide = () => save();
    window.addEventListener("pagehide", onHide);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pagehide", onHide);
      save();
    };
  }, [save]);

  function onMediaError() {
    // Signed links expire: ask for a fresh one and carry on from the same point.
    if (refreshes.current >= MAX_LINK_REFRESHES) {
      setError("This video could not be played. Please try another lesson or try again later.");
      return;
    }
    refreshes.current += 1;
    resumeAt.current = videoRef.current?.currentTime ?? resumeAt.current;
    void loadLink();
  }

  return (
    <div>
      {src ? (
        <video
          ref={videoRef}
          src={src}
          controls
          playsInline
          autoPlay
          preload="metadata"
          aria-label={lesson.title}
          className="aspect-video w-full rounded-lg bg-black"
          onLoadedMetadata={(e) => {
            if (resumeAt.current > 0) e.currentTarget.currentTime = resumeAt.current;
          }}
          onPause={() => save()}
          onEnded={() => save(true)}
          onError={onMediaError}
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-slate-100 text-sm text-muted dark:bg-dark-surface-alt dark:text-slate-400">
          {error ? null : "Loading video..."}
        </div>
      )}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={onPrevious} disabled={!hasPrevious}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext}>
          {lesson.completed ? "Next lesson" : "Skip lesson"}
          {lesson.completed ? <ChevronRight className="h-4 w-4" aria-hidden="true" /> : <SkipForward className="h-4 w-4" aria-hidden="true" />}
        </Button>
      </div>
    </div>
  );
}
