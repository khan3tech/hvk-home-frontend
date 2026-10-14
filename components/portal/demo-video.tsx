"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { portalApi } from "@/lib/api/portal";
import { errorMessage } from "@/lib/api/client";
import { STEP_ROUTE } from "@/lib/journey";
import { FormMessage } from "./form-field";
import { PageShell } from "./page-shell";

const VIDEO_URL = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL ?? "";

/** Demo video: Next unlocks when the video ends; Skip is always available. Both continue to payment. */
export function DemoVideo() {
  const router = useRouter();
  const [ended, setEnded] = React.useState(false);
  const [busy, setBusy] = React.useState<"complete" | "skip" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function finish(action: "complete" | "skip") {
    setError(null);
    setBusy(action);
    try {
      const status = action === "complete" ? await portalApi.completeDemo() : await portalApi.skipDemo();
      router.push(STEP_ROUTE[status.step]);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(null);
    }
  }

  return (
    <PageShell eyebrow="Step 2 of 6" title="Watch the demo" intro="A quick walkthrough of the registration, exam and results process.">
      {VIDEO_URL ? (
        <video
          src={VIDEO_URL}
          controls
          playsInline
          preload="metadata"
          onEnded={() => setEnded(true)}
          className="aspect-video w-full rounded-lg bg-black"
          aria-label="Programme demo video"
        />
      ) : (
        <p className="rounded-lg bg-light-blue/50 p-6 text-sm text-muted dark:bg-dark-surface-alt dark:text-slate-400">
          The demo video isn&apos;t available right now. You can skip to the next step.
        </p>
      )}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={() => void finish("skip")} disabled={busy !== null}>
          <SkipForward className="h-4 w-4" aria-hidden="true" />
          {busy === "skip" ? "Skipping..." : "Skip"}
        </Button>
        <Button onClick={() => void finish("complete")} disabled={!ended || busy !== null} aria-describedby={!ended ? "next-hint" : undefined}>
          {busy === "complete" ? "Continuing..." : "Next"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      {!ended ? (
        <p id="next-hint" className="mt-2 text-right text-xs text-muted dark:text-slate-500">
          Next unlocks when the video finishes.
        </p>
      ) : null}
      <div className="mt-3 text-right">
        <FormMessage>{error}</FormMessage>
      </div>
    </PageShell>
  );
}
