"use client";

import * as React from "react";

/** The id of the watched section currently in the middle of the screen, or null. Does nothing when `enabled` is false. */
export function useSectionSpy(ids: string[], enabled: boolean): string | null {
  const [current, setCurrent] = React.useState<string | null>(null);
  const key = ids.join("|");

  React.useEffect(() => {
    if (!enabled || typeof IntersectionObserver === "undefined") return;
    const sections = key.split("|").map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;
    const inView = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inView.add(entry.target.id);
          else inView.delete(entry.target.id);
        }
        // The first watched section (in page order) that is in the middle band wins.
        setCurrent(sections.find((el) => inView.has(el.id))?.id ?? null);
      },
      { rootMargin: "-40% 0px -50% 0px" },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [enabled, key]);

  return enabled ? current : null;
}
