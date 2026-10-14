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
    <h1 ref={ref} tabIndex={-1} className={cn("outline-none", className)}>
      {children}
    </h1>
  );
}
