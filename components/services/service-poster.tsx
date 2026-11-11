import Image from "next/image";
import { Award, BarChart3, Briefcase, FileText, Laptop, Map, Mic, Monitor, PlayCircle, Target, Users, Wrench, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PosterIcon = "play" | "award" | "briefcase" | "laptop" | "users" | "file" | "target" | "map" | "mic" | "wrench" | "monitor" | "chart";

const FEATURE_ICONS: Record<PosterIcon, LucideIcon> = {
  play: PlayCircle,
  award: Award,
  briefcase: Briefcase,
  laptop: Laptop,
  users: Users,
  file: FileText,
  target: Target,
  map: Map,
  mic: Mic,
  wrench: Wrench,
  monitor: Monitor,
  chart: BarChart3,
};

export interface PosterContent {
  /** The call-to-action shown on the poster's button (the poster itself is not clickable). */
  cta: string;
  /** The second tagline line, for example "Get certified. Grow faster." */
  lead: string;
  features: [{ label: string; icon: PosterIcon }, { label: string; icon: PosterIcon }, { label: string; icon: PosterIcon }];
  /** Transparent 3D illustration in /public/images/posters. */
  image: string;
  /** Colour of the second line of the heading on the blue poster. */
  highlight: string;
}

/** "Training & Certification" -> ["Training &", "Certification"]; "Career Guidance" -> ["Career", "Guidance"]. */
export function splitTitle(title: string): [string, string] {
  const words = title.split(" ");
  const head = words[1] === "&" ? 2 : 1;
  return [words.slice(0, head).join(" "), words.slice(head).join(" ")];
}

/**
 * A service poster: badge, two-line heading, tagline, button, 3D illustration and three features.
 * Drawn with HTML so the words stay sharp and editable; only the illustration is an image. Every size is in
 * container units (cqw), so it scales like a picture: large on the service page, small on a service card.
 * Decorative: the heading and text next to it carry the meaning.
 */
export function ServicePoster({
  icon: Icon,
  title,
  tagline,
  accent,
  poster,
  variant = "blue",
  className,
}: {
  icon: LucideIcon;
  title: string;
  tagline: string;
  accent: [string, string];
  poster: PosterContent;
  variant?: "blue" | "light";
  className?: string;
}) {
  const [first, second] = splitTitle(title);
  const blue = variant === "blue";

  return (
    <div
      aria-hidden="true"
      data-poster={variant}
      className={cn("relative isolate aspect-square w-full overflow-hidden", blue ? "text-white" : "border border-slate-100 bg-white text-[#0b1220] dark:border-white/10", className)}
      style={{ containerType: "inline-size", ...(blue ? { backgroundImage: `linear-gradient(145deg, ${accent[0]}, ${accent[1]})` } : {}) }}
    >
      {blue ? (
        <>
          <span className="absolute -right-[12cqw] -top-[14cqw] -z-10 h-[52cqw] w-[52cqw] rounded-full bg-white/15" />
          <span className="absolute -bottom-[20cqw] -left-[14cqw] -z-10 h-[56cqw] w-[56cqw] rounded-full bg-white/10" />
        </>
      ) : (
        <span className="absolute -right-[16cqw] -top-[16cqw] -z-10 h-[50cqw] w-[50cqw] rounded-full opacity-[0.12]" style={{ backgroundImage: `linear-gradient(145deg, ${accent[0]}, ${accent[1]})` }} />
      )}

      <div className="absolute inset-0 flex flex-col p-[5.5cqw]">
        <span
          className={cn("inline-flex w-fit items-center gap-[1.4cqw] rounded-[1.6cqw] px-[2.6cqw] py-[1.6cqw] font-bold uppercase tracking-[0.12em]", blue ? "bg-white/15" : "text-white")}
          style={{ fontSize: "3cqw", ...(blue ? {} : { backgroundColor: accent[0] }) }}
        >
          <Icon style={{ width: "3.6cqw", height: "3.6cqw" }} />
          HVK Tech
        </span>

        <p className="mt-[3.6cqw] font-extrabold leading-[1.1]" style={{ fontSize: "8.8cqw" }}>
          {first}
          <br />
          <span style={{ color: blue ? poster.highlight : accent[0] }}>{second}</span>
        </p>

        <p className="mt-[3cqw] max-w-[55cqw] leading-[1.22]" style={{ fontSize: "4.5cqw" }}>
          {tagline}
        </p>
        <p className="mt-[2.2cqw] max-w-[55cqw] leading-[1.22]" style={{ fontSize: "4.5cqw" }}>
          {poster.lead}
        </p>

        <span
          className={cn("mt-[3.4cqw] inline-flex w-fit items-center gap-[2cqw] rounded-[2.2cqw] font-bold", blue ? "bg-white text-[#0b1220]" : "border")}
          style={{ fontSize: "3.5cqw", padding: "2.5cqw 4.6cqw", ...(blue ? {} : { borderColor: accent[0], color: accent[0] }) }}
        >
          {poster.cta}
          <span aria-hidden="true">→</span>
        </span>

        <ul className="mt-auto grid grid-cols-3 items-center" style={{ gap: "1.5cqw" }}>
          {poster.features.map((feature, index) => {
            const FeatureIcon = FEATURE_ICONS[feature.icon];
            return (
              <li key={feature.label} className={cn("flex items-center gap-[1.8cqw]", index > 0 && "border-l pl-[1.8cqw]", blue ? "border-white/40" : "border-slate-300")}>
                <span className={cn("flex shrink-0 items-center justify-center rounded-full", blue ? "bg-black/25" : "text-white")} style={{ width: "7cqw", height: "7cqw", ...(blue ? {} : { backgroundColor: accent[0] }) }}>
                  <FeatureIcon style={{ width: "3.6cqw", height: "3.6cqw" }} />
                </span>
                <span className="font-medium leading-[1.15]" style={{ fontSize: "3cqw" }}>
                  {feature.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="absolute" style={{ right: "3cqw", top: "34cqw", width: "36cqw", height: "32cqw" }}>
        <Image src={poster.image} alt="" fill sizes="(min-width: 1024px) 20vw, 40vw" className="object-contain" />
      </div>
    </div>
  );
}
