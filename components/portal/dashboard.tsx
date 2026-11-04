"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, PlayCircle, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LEARNING_PAGE, STAGES_MANUAL, STEP_ACTION, STEP_ROUTE, stepIndex } from "@/lib/journey";
import { usePaymentConfig } from "@/lib/use-payment-config";
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

/** Wording while staff approve payments: nothing to pay online, the candidate waits for approval. */
const MANUAL_HINT = "Pay the registration fee as described on the payment page. Once our team approves it, your videos and exam unlock.";
const WAITING_STEPS = ["registered", "demo_pending", "fee_pending"];

export function Dashboard() {
  const { candidate } = useSession();
  const { status } = useJourney();
  const { config } = usePaymentConfig();
  const step = status.step;
  const manual = config?.mode === "manual";
  const waiting = manual && WAITING_STEPS.includes(step);
  // The videos open once the fee is paid (reached exam_ready); in online mode they are also offered before payment as the demo.
  const showVideos = stepIndex(step) >= stepIndex("exam_ready");

  return (
    <PageShell eyebrow="My dashboard" title={`Welcome, ${candidate?.fullName.split(" ")[0] ?? "there"}`} intro={waiting ? MANUAL_HINT : HINTS[step]}>
      <JourneyStepper step={step} {...(manual ? { stages: STAGES_MANUAL } : {})} />
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={STEP_ROUTE[step]} className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
          {waiting ? "View payment status" : STEP_ACTION[step]} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        {showVideos ? (
          <Link href={LEARNING_PAGE} className={cn(buttonVariants({ variant: "outline" }))}>
            <PlayCircle className="h-4 w-4" aria-hidden="true" /> Course videos
          </Link>
        ) : null}
        <Link href="/profile" className={cn(buttonVariants({ variant: "ghost" }))}>
          <UserRound className="h-4 w-4" aria-hidden="true" /> My profile
        </Link>
        <Link href="/examinations" className={cn(buttonVariants({ variant: "ghost" }))}>
          <ClipboardList className="h-4 w-4" aria-hidden="true" /> My examinations
        </Link>
      </div>
    </PageShell>
  );
}
