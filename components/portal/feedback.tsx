"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { portalApi } from "@/lib/api/portal";
import { ApiError, errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { FieldLabel, FormMessage } from "./form-field";
import { PageShell } from "./page-shell";
import { useJourney } from "./portal-gate";

const QUESTIONS = [
  { id: "clarity", label: "How clear were the exam instructions?" },
  { id: "difficulty", label: "How would you describe the difficulty?" },
] as const;

const MAX_COMMENTS = 2000;

/** Star rating as an accessible radio group. */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Overall rating" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-blue"
        >
          <Star className={cn("h-8 w-8", n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600")} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

export function Feedback() {
  const router = useRouter();
  const { reload } = useJourney();
  const [rating, setRating] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [comments, setComments] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (rating < 1) {
      setError("Please choose a rating from 1 to 5 stars.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const exam = await portalApi.currentExam();
      await portalApi.submitFeedback(exam.attemptId, {
        rating,
        answers: Object.entries(answers)
          .filter(([, a]) => a.trim())
          .map(([questionId, answer]) => ({ questionId, answer: answer.trim() })),
        ...(comments.trim() ? { comments: comments.trim() } : {}),
      });
      await reload();
      router.push("/thank-you");
    } catch (err) {
      if (err instanceof ApiError && err.code === "FEEDBACK_EXISTS") {
        await reload().catch(() => undefined);
        router.push("/thank-you");
        return;
      }
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <PageShell eyebrow="Step 5 of 6" title="How was your exam?" intro="Your feedback helps us improve. It takes less than a minute.">
      <form onSubmit={submit} noValidate className="space-y-6" aria-label="Exam feedback">
        <div>
          <p className="mb-2 text-sm font-semibold text-ink dark:text-slate-200">
            Overall rating <span className="text-red-500">*</span>
          </p>
          <StarRating value={rating} onChange={setRating} />
        </div>
        {QUESTIONS.map((q) => (
          <div key={q.id}>
            <FieldLabel htmlFor={`q-${q.id}`} required={false}>{q.label}</FieldLabel>
            <input
              id={`q-${q.id}`}
              maxLength={1000}
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              className="h-12 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-ink focus:border-bright-blue focus:outline-none focus:ring-2 focus:ring-bright-blue/20 dark:border-white/10 dark:bg-dark-surface-alt dark:text-slate-100"
            />
          </div>
        ))}
        <div>
          <FieldLabel htmlFor="comments" required={false}>Anything else?</FieldLabel>
          <textarea
            id="comments"
            rows={4}
            maxLength={MAX_COMMENTS}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            aria-describedby="comments-count"
            className="w-full rounded-lg border border-slate-200 bg-white p-3.5 text-sm text-ink focus:border-bright-blue focus:outline-none focus:ring-2 focus:ring-bright-blue/20 dark:border-white/10 dark:bg-dark-surface-alt dark:text-slate-100"
          />
          <p id="comments-count" className="mt-1 text-right text-xs text-muted">{comments.length}/{MAX_COMMENTS}</p>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit feedback"}
        </Button>
        <FormMessage>{error}</FormMessage>
      </form>
    </PageShell>
  );
}
