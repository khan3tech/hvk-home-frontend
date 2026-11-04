import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTotal } from "@/lib/learning";
import { groupTracks } from "@/lib/track-groups";
import { trackArt } from "@/lib/track-art";
import type { LearningTrack } from "@/types/api";

/** "Choose your learning path": one card per track. A track without videos yet is shown as Coming soon and cannot be chosen. */
function TrackCards({ tracks, busyId, onChoose, Heading }: { tracks: LearningTrack[]; busyId: string | null; onChoose: (track: LearningTrack) => void; Heading: "h2" | "h3" }) {
  return (
    <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {tracks.map((track) => {
        const art = trackArt(track.slug);
        const Icon = art.icon;
        const percent = track.lessonCount > 0 ? Math.round((track.completedCount / track.lessonCount) * 100) : 0;
        return (
          <li key={track.id} className="flex flex-col overflow-hidden rounded-xl2 border border-slate-100 bg-white shadow-card dark:border-white/10 dark:bg-dark-surface">
            <div
              aria-hidden="true"
              className="relative flex h-28 items-center justify-between overflow-hidden px-6 text-white"
              style={{ backgroundImage: `linear-gradient(135deg, ${art.accent[0]}, ${art.accent[1]})`, opacity: track.available ? 1 : 0.7 }}
            >
              <Icon className="h-12 w-12" strokeWidth={1.5} />
              <Icon className="absolute -bottom-6 -right-4 h-32 w-32 text-white/20" strokeWidth={1.25} />
              {!track.available ? (
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur-sm">Coming soon</span>
              ) : track.selected ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur-sm">
                  <Check className="h-3.5 w-3.5" /> Your track
                </span>
              ) : null}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <Heading className="text-lg font-bold text-navy dark:text-white">{track.title}</Heading>
              {track.description ? <p className="mt-1 text-sm leading-relaxed text-muted dark:text-slate-400">{track.description}</p> : null}
              <p className="mt-3 text-xs text-muted dark:text-slate-400">
                {track.courseCount} course{track.courseCount === 1 ? "" : "s"}
                {track.available ? ` · ${track.lessonCount} lesson${track.lessonCount === 1 ? "" : "s"} · ${formatTotal(track.durationSeconds)}` : ""}
              </p>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label={`Courses in ${track.title}`}>
                {track.courses.map((course) => (
                  <li
                    key={course.id}
                    className={
                      course.comingSoon
                        ? "rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs font-semibold text-muted dark:border-white/20 dark:text-slate-400"
                        : "rounded-full bg-light-blue px-3 py-1 text-xs font-semibold text-primary-blue dark:bg-bright-blue/10 dark:text-bright-blue"
                    }
                  >
                    {course.title}
                    {course.comingSoon ? " · soon" : ""}
                  </li>
                ))}
              </ul>
              {track.available && track.completedCount > 0 ? (
                <div className="mt-4">
                  <div
                    role="progressbar"
                    aria-label={`${track.title} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                    className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
                  >
                    <div className="h-full bg-bright-blue" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              ) : null}
              <div className="mt-auto pt-5">
                <Button size="sm" disabled={!track.available || busyId !== null} onClick={() => onChoose(track)} aria-label={track.available ? `${track.selected ? "Continue" : "Choose"} ${track.title}` : `${track.title} is coming soon`}>
                  {!track.available ? "Coming soon" : busyId === track.id ? "Opening..." : track.selected ? "Continue" : "Choose this track"}
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** "Choose your learning path": pathways grouped under their domain (for example Full Stack Development > MERN, MEAN). */
export function TrackList({ tracks, busyId, onChoose }: { tracks: LearningTrack[]; busyId: string | null; onChoose: (track: LearningTrack) => void }) {
  const groups = groupTracks(tracks);
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.domain || "other"} aria-labelledby={group.domain ? `domain-${group.domain.replace(/\W+/g, "-")}` : undefined}>
          {group.domain ? (
            <h2 id={`domain-${group.domain.replace(/\W+/g, "-")}`} className="mb-4 border-l-4 border-bright-blue pl-3 text-xl font-extrabold text-navy dark:text-white">
              {group.domain}
            </h2>
          ) : null}
          <TrackCards tracks={group.tracks} busyId={busyId} onChoose={onChoose} Heading={group.domain ? "h3" : "h2"} />
        </section>
      ))}
    </div>
  );
}
