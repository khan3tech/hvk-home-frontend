import { Check } from "lucide-react";
import type { OnboardingStep } from "@/types/api";
import { STAGES, stepIndex } from "@/lib/journey";
import { cn } from "@/lib/utils";

type StageState = "done" | "current" | "upcoming";

export function stageStates(step: OnboardingStep): StageState[] {
  const current = stepIndex(step);
  return STAGES.map(({ steps }) => {
    if (steps.includes(step)) return step === "completed" ? "done" : "current";
    return Math.max(...steps.map(stepIndex)) < current ? "done" : "upcoming";
  });
}

/** Registered → Demo → Payment → Exam → Feedback → Result, driven by the API's onboarding step. */
export function JourneyStepper({ step }: { step: OnboardingStep }) {
  const states = stageStates(step);
  return (
    <ol aria-label="Your progress" className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {STAGES.map((stage, i) => {
        const state = states[i]!;
        return (
          <li key={stage.label} aria-current={state === "current" ? "step" : undefined} className="flex flex-col items-center gap-2 text-center">
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold",
                state === "done" && "border-green-500 bg-green-500 text-white",
                state === "current" && "border-bright-blue bg-bright-blue text-white ring-4 ring-bright-blue/20",
                state === "upcoming" && "border-slate-200 bg-white text-muted dark:border-white/10 dark:bg-dark-surface-alt",
              )}
            >
              {state === "done" ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
            </span>
            <span className={cn("text-xs font-semibold", state === "upcoming" ? "text-muted dark:text-slate-500" : "text-navy dark:text-white")}>
              {stage.label}
              <span className="sr-only">{state === "done" ? " (completed)" : state === "current" ? " (current step)" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
