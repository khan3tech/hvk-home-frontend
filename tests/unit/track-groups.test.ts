import { describe, expect, it } from "vitest";
import { groupTracks } from "@/lib/track-groups";
import type { LearningTrack } from "@/types/api";

const t = (slug: string, domain: string): LearningTrack => ({
  id: slug, title: slug, slug, description: "", position: 1, domain, domainPosition: 0, available: true, selected: false,
  courseCount: 0, availableCourseCount: 0, lessonCount: 0, completedCount: 0, durationSeconds: 0, courses: [],
});

describe("groupTracks", () => {
  it("groups neighbouring pathways of a domain and keeps the API order", () => {
    const groups = groupTracks([t("mern", "Full Stack"), t("mean", "Full Stack"), t("angular", "Frontend"), t("solo", "")]);
    expect(groups.map((g) => [g.domain, g.tracks.map((x) => x.slug)])).toEqual([["Full Stack", ["mern", "mean"]], ["Frontend", ["angular"]], ["", ["solo"]]]);
  });

  it("handles no tracks", () => {
    expect(groupTracks([])).toEqual([]);
  });
});
