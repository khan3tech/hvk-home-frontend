"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList, Lock, PlayCircle, UserRound } from "lucide-react";
import { LEARNING_PAGE, STAGES_MANUAL, STEP_ACTION, STEP_ROUTE, stepIndex } from "@/lib/journey";
import { usePaymentConfig } from "@/lib/use-payment-config";
import { useSession } from "@/lib/session/session-provider";
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

const tileClass =
  "flex h-full flex-col gap-3 rounded-xl2 border border-slate-100 bg-white p-6 shadow-card transition dark:border-white/10 dark:bg-dark-surface-alt";

function Tile({ href, icon: Icon, title, text }: { href: string; icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>; title: string; text: string }) {
  return (
    <Link href={href} className={`${tileClass} group hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-blue`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-light-blue text-primary-blue transition-colors group-hover:bg-bright-blue group-hover:text-white dark:bg-bright-blue/10 dark:text-bright-blue">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="text-lg font-bold text-navy dark:text-white">{title}</span>
      <span className="flex-1 text-sm leading-relaxed text-muted dark:text-slate-400">{text}</span>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-blue dark:text-bright-blue" aria-hidden="true">
        Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function Dashboard() {
  const { candidate } = useSession();
  const { status } = useJourney();
  const { config } = usePaymentConfig();
  const step = status.step;
  const manual = config?.mode === "manual";
  const waiting = manual && WAITING_STEPS.includes(step);
  // The videos open once the fee is paid (reached exam_ready).
  const showVideos = stepIndex(step) >= stepIndex("exam_ready");

  return (
    <PageShell
      eyebrow="My dashboard"
      title={`Welcome, ${candidate?.fullName.split(" ")[0] ?? "there"}`}
      intro="See where you are in the programme and pick up where you left off."
      width="max-w-6xl"
    >
      <div className="py-2 sm:py-4">
        <JourneyStepper step={step} {...(manual ? { stages: STAGES_MANUAL } : {})} />
      </div>

      <section aria-labelledby="next-step-title" className="mt-10 flex flex-col gap-6 rounded-xl2 bg-gradient-to-r from-primary-blue to-bright-blue p-7 text-white shadow-card sm:p-9 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">Next step</p>
          <h2 id="next-step-title" className="mt-2 text-2xl font-extrabold sm:text-3xl">
            {waiting ? "Waiting for payment approval" : STEP_ACTION[step]}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/90">{waiting ? MANUAL_HINT : HINTS[step]}</p>
        </div>
        <Link
          href={STEP_ROUTE[step]}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-white px-7 text-base font-semibold text-primary-blue shadow-sm transition-colors hover:bg-light-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-blue"
        >
          {waiting ? "View payment status" : STEP_ACTION[step]} <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </section>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {showVideos ? (
          <Tile href={LEARNING_PAGE} icon={PlayCircle} title="Course videos" text="Pick a learning track and watch your courses, lesson by lesson, at your own pace." />
        ) : (
          <div aria-disabled="true" className={`${tileClass} opacity-75`}>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-muted dark:bg-white/10 dark:text-slate-400">
              <Lock className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold text-navy dark:text-white">Course videos</span>
            <span className="flex-1 text-sm leading-relaxed text-muted dark:text-slate-400">
              {manual ? "Unlocks once your payment is approved." : "Unlocks once your registration fee is paid."}
            </span>
          </div>
        )}
        <Tile href="/examinations" icon={ClipboardList} title="My examinations" text="See your exams, take the ones that are ready, and check your results." />
        <Tile href="/profile" icon={UserRound} title="My profile" text="Check and update your name, college and contact details." />
      </div>
    </PageShell>
  );
}
