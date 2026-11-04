import { BarChart3, Brain, Code2, Coffee, GraduationCap, Layers, LayoutTemplate, Server, Triangle, type LucideIcon } from "lucide-react";

/** Icon and colours for a track card, by track slug. Unknown slugs get a neutral default. */
export interface TrackArt {
  icon: LucideIcon;
  accent: [string, string];
}

const ART: Record<string, TrackArt> = {
  "mern-stack": { icon: Layers, accent: ["#047857", "#0ea5e9"] },
  "mean-stack": { icon: Triangle, accent: ["#b91c1c", "#f97316"] },
  "java-full-stack": { icon: Coffee, accent: ["#b45309", "#dc2626"] },
  "python-full-stack": { icon: Code2, accent: ["#1d4ed8", "#eab308"] },
  "frontend-angular": { icon: Triangle, accent: ["#be123c", "#7c3aed"] },
  "frontend-react-nextjs": { icon: LayoutTemplate, accent: ["#0369a1", "#0ea5e9"] },
  "frontend-developer": { icon: LayoutTemplate, accent: ["#1d4ed8", "#0ea5e9"] },
  "full-stack-developer": { icon: Layers, accent: ["#6d28d9", "#2563eb"] },
  "backend-developer": { icon: Server, accent: ["#047857", "#0ea5e9"] },
  "ai-engineer": { icon: Brain, accent: ["#be185d", "#7c3aed"] },
  "data-science": { icon: BarChart3, accent: ["#b45309", "#db2777"] },
};

const DEFAULT_ART: TrackArt = { icon: GraduationCap, accent: ["#1d4ed8", "#0ea5e9"] };

export const trackArt = (slug: string): TrackArt => ART[slug] ?? DEFAULT_ART;
