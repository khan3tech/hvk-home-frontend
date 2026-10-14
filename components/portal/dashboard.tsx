"use client";

import Link from "next/link";
import { ArrowRight, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { STEP_ACTION, STEP_ROUTE } from "@/lib/journey";
import { useSession } from "@/lib/session/session-provider";
import { cn } from "@/lib/utils";
import { JourneyStepper } from "./journey-stepper";
import { PageShell } from "./page-shell";
import { useJourney } from "./portal-gate";

const HINTS: Record<string, string> = {
  registered: "Start by watching a short demo of how the programme works.",
  demo_pending: "Start by watching a short demo of how the programme works.",
  fee_pending: "Pay the registration fee to unlock your exam.",
  exam_ready: "Your exam is ready. Take it whenever you're set.",
  exam_in_progress: "Your exam is in progress. Finish it to continue.",
  exam_completed: "Exam completed. Tell us how it went.",
  feedback_submitted: "Thanks for your feedback! Your result will be emailed within 24 hours of completing the exam.",
  completed: "Your result is ready.",
};

export function Dashboard() {
  const { candidate } = useSession();
  const { status } = useJourney();
  const step = status.step;

  return (
    <PageShell eyebrow="My dashboard" title={`Welcome, ${candidate?.fullName.split(" ")[0] ?? "there"}`} intro={HINTS[step]}>
      <JourneyStepper step={step} />
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={STEP_ROUTE[step]} className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
          {STEP_ACTION[step]} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link href="/profile" className={cn(buttonVariants({ variant: "ghost" }))}>
          <UserRound className="h-4 w-4" aria-hidden="true" /> My profile
        </Link>
      </div>
    </PageShell>
  );
}
