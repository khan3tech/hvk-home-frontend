import { Check } from "lucide-react";
import type { OnboardingStep } from "@/types/api";
import { STAGES, stepIndex } from "@/lib/journey";

type Stage = { label: string; steps: OnboardingStep[] };
import { cn } from "@/lib/utils";

type StageState = "done" | "current" | "upcoming";

export function stageStates(step: OnboardingStep, stages: Stage[] = STAGES): StageState[] {
  const current = stepIndex(step);
  return stages.map(({ steps }) => {
    if (steps.includes(step)) return step === "completed" ? "done" : "current";
    return Math.max(...steps.map(stepIndex)) < current ? "done" : "upcoming";
  });
}

/** Registered → Demo → Payment → Exam → Feedback → Result, driven by the API's onboarding step. */
export function JourneyStepper({ step, stages = STAGES }: { step: OnboardingStep; stages?: Stage[] }) {
  const states = stageStates(step, stages);
  return (
    <ol aria-label="Your progress" className={cn("grid grid-cols-3 gap-4", stages.length === 5 ? "sm:grid-cols-5" : "sm:grid-cols-6")}>
      {stages.map((stage, i) => {
        const state = states[i]!;
        return (
          <li key={stage.label} aria-current={state === "current" ? "step" : undefined} className="flex flex-col items-center gap-2 text-center">
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full border-2 text-base font-bold",
                state === "done" && "border-green-500 bg-green-500 text-white",
                state === "current" && "border-bright-blue bg-bright-blue text-white ring-4 ring-bright-blue/20",
                state === "upcoming" && "border-slate-200 bg-white text-muted dark:border-white/10 dark:bg-dark-surface-alt",
              )}
            >
              {state === "done" ? <Check className="h-5 w-5" aria-hidden="true" /> : i + 1}
            </span>
            <span className={cn("text-sm font-semibold", state === "upcoming" ? "text-muted dark:text-slate-500" : "text-navy dark:text-white")}>
              {stage.label}
              <span className="sr-only">{state === "done" ? " (completed)" : state === "current" ? " (current step)" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
