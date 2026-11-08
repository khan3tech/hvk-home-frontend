import type { LearningTrack } from "@/types/api";

export interface TrackGroup {
  /** Heading shown above the pathways; empty for pathways that stand alone. */
  domain: string;
  tracks: LearningTrack[];
}

/** Groups pathways under their domain heading, keeping the order the API sent (domain, then pathway). */
export function groupTracks(tracks: LearningTrack[]): TrackGroup[] {
  const groups: TrackGroup[] = [];
  for (const track of tracks) {
    const last = groups[groups.length - 1];
    if (last && last.domain === track.domain) last.tracks.push(track);
    else groups.push({ domain: track.domain, tracks: [track] });
  }
  return groups;
}
