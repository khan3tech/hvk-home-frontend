import { BarChart3, Brain, GraduationCap, Layers, LayoutTemplate, Server, type LucideIcon } from "lucide-react";

/** Icon and colours for a track card, by track slug. Unknown slugs get a neutral default. */
export interface TrackArt {
  icon: LucideIcon;
  accent: [string, string];
}

const ART: Record<string, TrackArt> = {
  "frontend-developer": { icon: LayoutTemplate, accent: ["#1d4ed8", "#0ea5e9"] },
  "full-stack-developer": { icon: Layers, accent: ["#6d28d9", "#2563eb"] },
  "backend-developer": { icon: Server, accent: ["#047857", "#0ea5e9"] },
  "ai-engineer": { icon: Brain, accent: ["#be185d", "#7c3aed"] },
  "data-science": { icon: BarChart3, accent: ["#b45309", "#db2777"] },
};

const DEFAULT_ART: TrackArt = { icon: GraduationCap, accent: ["#1d4ed8", "#0ea5e9"] };

export const trackArt = (slug: string): TrackArt => ART[slug] ?? DEFAULT_ART;
