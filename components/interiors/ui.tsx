import * as React from "react";
import Image from "next/image";
import { Armchair, Compass, Flower2, Hammer, Home, Paintbrush, Ruler, Sofa, ClipboardCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InteriorService } from "@/lib/interiors/content";

/** Colours of HVK Interiors: cream page, deep green text and buttons, mustard accent. */
export const INK = "text-[#0f3b32]";

export const interiorsButton =
  "inline-flex items-center justify-center gap-2 rounded-md bg-[#0f3b32] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#0a2a24] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0a826] disabled:opacity-60";
export const interiorsButtonLight =
  "inline-flex items-center justify-center gap-2 rounded-md border border-[#0f3b32] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#0f3b32] transition hover:bg-[#0f3b32] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0a826]";

export const interiorsInput =
  "mt-1 w-full rounded-md border border-[#cfd6cf] bg-white px-3 py-2.5 text-sm text-[#1f2a26] placeholder:text-[#8a948f] focus:border-[#0f3b32] focus:outline-none focus:ring-2 focus:ring-[#e0a826]/50";

const ICONS: Record<InteriorService["icon"], LucideIcon> = {
  sofa: Sofa,
  hammer: Hammer,
  ruler: Ruler,
  armchair: Armchair,
  paintbrush: Paintbrush,
  clipboard: ClipboardCheck,
  flower: Flower2,
  compass: Compass,
};

export function ServiceIcon({ name, className }: { name: InteriorService["icon"]; className?: string }) {
  const Icon = ICONS[name] ?? Home;
  return <Icon className={className} aria-hidden="true" />;
}

const GRADIENTS = [
  ["#d9cbb0", "#8a6f4d"],
  ["#c9d5cc", "#4f7a68"],
  ["#e6d8c3", "#b08a52"],
  ["#d2d9d6", "#5f7f7a"],
  ["#eadfd0", "#9c7a5c"],
  ["#cfd8c9", "#6c8a5b"],
];

/**
 * A project or service picture. Shows the photo when there is one; until then a soft gradient with an icon,
 * so the pages look finished and a real photo can be dropped in later.
 */
export function Visual({ image, alt, index = 0, icon, className, priority = false }: { image?: string | undefined; alt: string; index?: number; icon?: InteriorService["icon"]; className?: string; priority?: boolean }) {
  if (image) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image src={image} alt={alt} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" priority={priority} />
      </div>
    );
  }
  const [from, to] = GRADIENTS[index % GRADIENTS.length]!;
  return (
    <div role="img" aria-label={alt} className={cn("relative flex items-center justify-center overflow-hidden text-white/70", className)} style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}>
      <ServiceIcon name={icon ?? "sofa"} className="h-16 w-16 opacity-80" />
      <div aria-hidden="true" className="absolute -bottom-10 -right-6 h-40 w-40 rounded-full bg-white/10" />
    </div>
  );
}

/** Serif heading with the mustard dot behind its first letter, as in the design. */
export function SectionTitle({ children, id, className }: { children: string; id?: string; className?: string }) {
  const first = children.slice(0, 1);
  return (
    <h2 id={id} className={cn("relative inline-block font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#0f3b32] sm:text-4xl", className)}>
      <span aria-hidden="true" className="absolute -left-3 -top-2 h-10 w-10 rounded-full bg-[#e0a826]/90" />
      <span className="relative">
        {first}
        {children.slice(1)}
      </span>
    </h2>
  );
}
