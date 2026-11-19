import Link from "next/link";
import { Award, Lock } from "lucide-react";
import type { SkillExam } from "@/types/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { usePaymentPrompt } from "@/components/portal/payment-prompt";
import { cn } from "@/lib/utils";

export const skillExamHref = (examId: string) => `/skill-exam/${encodeURIComponent(examId)}`;

/** "100 questions · 120 min". No pass mark is shown to candidates (owner decision). */
export const examFacts = (exam: SkillExam) => `${exam.questionCount} questions · ${exam.durationMinutes} min`;

const STATE_LABEL: Partial<Record<SkillExam["state"], string>> = {
  qualified: "Qualified",
  disqualified: "Disqualified",
  terminated: "Exam ended",
  in_progress: "Exam ended",
};

/** Outcome chip once the candidate has taken this exam: Qualified, Disqualified or Exam ended. */
export function ExamStatus({ exam }: { exam: SkillExam }) {
  const label = STATE_LABEL[exam.state];
  if (!label) return null;
  return (
    <span
      className={cn(
        "text-xs font-semibold",
        exam.state === "qualified" ? "text-green-700 dark:text-green-400" : exam.state === "disqualified" ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400",
      )}
    >
      {label}
    </span>
  );
}

/**
 * The button of one exam. One exam per candidate: once one is taken, the others show "Locked" (disabled);
 * the taken one shows "View result". Before the payment it opens the payment popup.
 */
export function ExamAction({ exam, size = "sm", variant = "outline" }: { exam: SkillExam; size?: "sm" | "default"; variant?: "outline" | "primary" }) {
  const prompt = usePaymentPrompt();
  if (!exam.unlocked) {
    return (
      <Button size={size} variant="outline" onClick={prompt.open} aria-label={`Unlock the exam for ${exam.targetTitle}`}>
        <Lock className="h-4 w-4" aria-hidden="true" /> Exam
      </Button>
    );
  }
  if (exam.state === "locked") {
    return (
      <Button size={size} variant="outline" disabled aria-label={`Exam for ${exam.targetTitle} is locked: you have already taken an exam`} title="You have already taken an exam">
        <Lock className="h-4 w-4" aria-hidden="true" /> Locked
      </Button>
    );
  }
  const label = exam.state === "available" ? "Take exam" : "View result";
  return (
    <Link href={skillExamHref(exam.id)} className={buttonVariants({ variant, size })} aria-label={`${label} for ${exam.targetTitle}`}>
      {label}
    </Link>
  );
}

/** The one exam of a learning path (e.g. MERN Stack), covering all its courses. */
export function TrackExamCard({ exam }: { exam: SkillExam }) {
  return (
    <section aria-label={`${exam.targetTitle} exam`} className="flex flex-col gap-3 rounded-xl2 border border-amber-200 bg-amber-50/70 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-amber-400/20 dark:bg-amber-400/5">
      <div className="flex items-start gap-3">
        <Award className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <div>
          <h2 className="text-base font-bold text-navy dark:text-white">{exam.targetTitle} exam</h2>
          <p className="mt-0.5 text-sm text-muted dark:text-slate-400">
            One exam for this learning path, covering its courses · {examFacts(exam)}
            {exam.unlocked ? "" : " · unlocks after payment"}
          </p>
          <ExamStatus exam={exam} />
        </div>
      </div>
      <ExamAction exam={exam} size="default" variant="primary" />
    </section>
  );
}
