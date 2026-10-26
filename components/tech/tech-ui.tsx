import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const techButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-[#1a140b] transition hover:-translate-y-px hover:bg-gold-light";

export const techOutlineButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-gold/70 px-6 py-3 text-sm font-semibold text-gold-light transition hover:border-gold-light hover:bg-gold/10";

export function TechEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "block text-xs font-medium uppercase tracking-[0.28em] text-gold",
        className
      )}
    >
      {children}
    </span>
  );
}

export function TechArrowCircle({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/40 text-white transition-colors",
        className
      )}
    >
      <ArrowRight className="h-4 w-4" />
    </span>
  );
}

/** Stacked gold words used as a vertical accent in the hero and CTA. */
export function TechWordStack({
  words,
  className,
}: {
  words: string[];
  className?: string;
}) {
  return (
    <ul
      aria-hidden="true"
      className={cn(
        "space-y-2 text-xs font-medium uppercase tracking-[0.3em] text-gold",
        className
      )}
    >
      {words.map((word) => (
        <li key={word}>{word}</li>
      ))}
    </ul>
  );
}
