"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Page title that receives focus when a portal step page mounts, so keyboard and screen-reader
 * users land on the new step instead of staying on the button they pressed.
 */
export function PageHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    // Not interactive: no focus ring (the global :focus-visible outline would otherwise draw a box).
    <h1 ref={ref} tabIndex={-1} className={cn(className)} style={{ outline: "none" }}>
      {children}
    </h1>
  );
}
