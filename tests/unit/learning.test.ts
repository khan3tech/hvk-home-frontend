import { describe, expect, it } from "vitest";
import {
  allCompleted,
  applyProgress,
  courseStatus,
  findLesson,
  flatLessons,
  formatDuration,
  formatTotal,
  neighbours,
  resumeLesson,
  sectionsOf,
  startPosition,
} from "@/lib/learning";
import type { LearningCourse, LearningLesson } from "@/types/api";

function lesson(id: string, over: Partial<LearningLesson> = {}): LearningLesson {
  return { id, title: id, sectionTitle: "Intro", sectionPosition: 1, position: 1, durationSeconds: 100, completed: false, positionSeconds: 0, ...over };
}

function course(id: string, lessons: LearningLesson[]): LearningCourse {
  return {
    id,
    title: id,
    slug: id,
    description: "",
    position: 1,
    lessonCount: lessons.length,
    completedCount: lessons.filter((l) => l.completed).length,
    durationSeconds: lessons.reduce((n, l) => n + l.durationSeconds, 0),
    lessons,
  };
}

const courses = [course("js", [lesson("a"), lesson("b", { sectionTitle: "Next", sectionPosition: 2 })]), course("html", [lesson("c")])];

describe("formatting", () => {
  it("formats durations", () => {
    expect(formatDuration(272)).toBe("4:32");
    expect(formatDuration(3725)).toBe("1:02:05");
    expect(formatDuration(-5)).toBe("0:00");
  });
  it("formats totals", () => {
    expect(formatTotal(20)).toBe("under a minute");
    expect(formatTotal(45 * 60)).toBe("45m");
    expect(formatTotal(3 * 3600)).toBe("3h");
    expect(formatTotal(3 * 3600 + 20 * 60)).toBe("3h 20m");
  });
});

describe("ordering", () => {
  it("flattens in viewing order and finds lessons", () => {
    expect(flatLessons(courses).map((r) => r.lesson.id)).toEqual(["a", "b", "c"]);
    expect(findLesson(courses, "c")?.course.id).toBe("html");
    expect(findLesson(courses, "zzz")).toBeNull();
    expect(findLesson(courses, null)).toBeNull();
  });
  it("navigates across courses", () => {
    expect(neighbours(courses, "a")).toMatchObject({ previous: null, next: { lesson: { id: "b" } } });
    expect(neighbours(courses, "b").next?.lesson.id).toBe("c");
    expect(neighbours(courses, "c").next).toBeNull();
    expect(neighbours(courses, "nope")).toEqual({ previous: null, next: null });
  });
  it("groups lessons into sections", () => {
    expect(sectionsOf(courses[0]!).map((s) => [s.title, s.lessons.length])).toEqual([["Intro", 1], ["Next", 1]]);
  });
});

describe("progress", () => {
  it("resumes at the first unfinished lesson, else the first", () => {
    expect(resumeLesson(course("x", [lesson("a", { completed: true }), lesson("b")]))?.id).toBe("b");
    expect(resumeLesson(course("x", [lesson("a", { completed: true })]))?.id).toBe("a");
    expect(resumeLesson(course("x", []))).toBeNull();
  });
  it("derives course status", () => {
    expect(courseStatus(course("x", [lesson("a")]))).toBe("not_started");
    expect(courseStatus(course("x", [lesson("a", { positionSeconds: 5 })]))).toBe("in_progress");
    expect(courseStatus(course("x", [lesson("a", { completed: true })]))).toBe("completed");
    expect(courseStatus(course("x", []))).toBe("not_started");
  });
  it("is complete only with content and every lesson done", () => {
    expect(allCompleted([])).toBe(false);
    expect(allCompleted([course("x", [])])).toBe(false);
    expect(allCompleted(courses)).toBe(false);
    expect(allCompleted([course("x", [lesson("a", { completed: true })])])).toBe(true);
  });
  it("restarts finished or nearly finished lessons", () => {
    expect(startPosition(lesson("a", { positionSeconds: 40 }))).toBe(40);
    expect(startPosition(lesson("a", { positionSeconds: 96 }))).toBe(0);
    expect(startPosition(lesson("a", { positionSeconds: 40, completed: true }))).toBe(0);
  });
  it("applies saved progress without mutating and never un-completes", () => {
    const next = applyProgress(courses, { lessonId: "a", positionSeconds: 100, completed: true });
    expect(next[0]!.lessons[0]).toMatchObject({ completed: true, positionSeconds: 100 });
    expect(next[0]!.completedCount).toBe(1);
    expect(next[1]).toBe(courses[1]);
    expect(courses[0]!.lessons[0]!.completed).toBe(false);
    const again = applyProgress(next, { lessonId: "a", positionSeconds: 3, completed: false });
    expect(again[0]!.lessons[0]).toMatchObject({ completed: true, positionSeconds: 3 });
  });
});
