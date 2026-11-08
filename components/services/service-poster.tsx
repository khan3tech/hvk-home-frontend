import type { LucideIcon } from "lucide-react";

/**
 * Decorative poster for a service: gradient, dotted grid and a large icon, drawn with CSS and SVG so it
 * stays sharp at any size and needs no image file. The heading next to it carries the meaning.
 */
export function ServicePoster({
  icon: Icon,
  title,
  tagline,
  accent,
  badges,
}: {
  icon: LucideIcon;
  title: string;
  tagline: string;
  accent: [string, string];
  badges: [string, string, string];
}) {
  return (
    <div
      aria-hidden="true"
      className="relative isolate flex aspect-[4/3] w-full flex-col justify-between overflow-hidden rounded-2xl p-6 text-white shadow-card-hover sm:p-8"
      style={{ backgroundImage: `linear-gradient(135deg, ${accent[0]}, ${accent[1]})` }}
    >
      <svg className="absolute inset-0 -z-10 h-full w-full opacity-25" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="poster-dots" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.6" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#poster-dots)" />
      </svg>
      <span className="absolute -right-10 -top-10 -z-10 h-56 w-56 rounded-full bg-white/15 blur-sm" />
      <span className="absolute -bottom-16 -left-10 -z-10 h-52 w-52 rounded-full bg-black/15" />
      <Icon className="absolute -bottom-6 -right-4 -z-10 h-56 w-56 text-white/20" strokeWidth={1.25} />

      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur-sm">
          <Icon className="h-3.5 w-3.5" />
          HVK Tech
        </span>
        <p className="mt-5 max-w-[16ch] text-2xl font-extrabold leading-tight sm:text-3xl">{title}</p>
        <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-white/85">{tagline}</p>
      </div>

      <ul className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <li key={badge} className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            {badge}
          </li>
        ))}
      </ul>
    </div>
  );
}
