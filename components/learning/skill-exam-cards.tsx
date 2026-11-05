import Link from "next/link";
import { Award, Lock } from "lucide-react";
import type { SkillExam } from "@/types/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const skillExamHref = (examId: string) => `/skill-exam/${encodeURIComponent(examId)}`;

function actionLabel(exam: SkillExam): string {
  if (exam.attempts === 0) return exam.openAttemptId ? "Continue exam" : "Take exam";
  return exam.openAttemptId ? "Continue exam" : "Retake exam";
}

/** Result line under an exam button: "Passed · best 80%" or "Best 30% · pass mark 40%". */
export function ExamStatus({ exam }: { exam: SkillExam }) {
  if (exam.attempts === 0 || exam.bestPercentage === null) return null;
  return (
    <span className={cn("text-xs font-semibold", exam.passed ? "text-green-700 dark:text-green-400" : "text-muted dark:text-slate-400")}>
      {exam.passed ? `Passed · best ${exam.bestPercentage}%` : `Best ${exam.bestPercentage}% · pass mark ${exam.passPercentage}%`}
    </span>
  );
}

/** The exam button of one course or domain: a link once the payment is approved, a locked button before. */
export function ExamAction({ exam, size = "sm", variant = "outline" }: { exam: SkillExam; size?: "sm" | "default"; variant?: "outline" | "primary" }) {
  if (!exam.unlocked) {
    return (
      <Button size={size} variant="outline" disabled title="Unlocks after your payment is approved" aria-label={`Exam for ${exam.targetTitle} unlocks after payment approval`}>
        <Lock className="h-4 w-4" aria-hidden="true" /> Exam
      </Button>
    );
  }
  return (
    <Link href={skillExamHref(exam.id)} className={buttonVariants({ variant, size })} aria-label={`${actionLabel(exam)} for ${exam.targetTitle}`}>
      {actionLabel(exam)}
    </Link>
  );
}

/** A domain exam: for a candidate who already knows the whole domain and wants to skip its courses. */
export function DomainExamCard({ exam }: { exam: SkillExam }) {
  return (
    <section aria-label={`${exam.targetTitle} domain exam`} className="flex flex-col gap-3 rounded-xl2 border border-amber-200 bg-amber-50/70 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-amber-400/20 dark:bg-amber-400/5">
      <div className="flex items-start gap-3">
        <Award className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <div>
          <h2 className="text-base font-bold text-navy dark:text-white">{exam.targetTitle}: domain exam</h2>
          <p className="mt-0.5 text-sm text-muted dark:text-slate-400">
            Already know this domain? Skip the courses and take the domain exam directly · {exam.questionCount} questions · {exam.durationMinutes} min · pass mark {exam.passPercentage}%
            {exam.unlocked ? "" : " · unlocks after payment approval"}
          </p>
          <ExamStatus exam={exam} />
        </div>
      </div>
      <ExamAction exam={exam} size="default" variant="primary" />
    </section>
  );
}
