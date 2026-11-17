"use client";

import * as React from "react";
import { Award, BookOpen, Loader2 } from "lucide-react";
import type { SkillExam } from "@/types/api";
import { ExamAction, ExamStatus } from "@/components/learning/skill-exam-cards";
import { skillExamApi } from "@/lib/api/skill-exams";
import { errorMessage } from "@/lib/api/client";
import { FormMessage } from "./form-field";

const facts = (e: SkillExam) => `${e.questionCount} questions · ${e.durationMinutes} min · pass mark ${e.passPercentage}%`;

/**
 * "Which exam do you want to take?": every published domain exam first, then every course exam.
 * Shown when a candidate clicks Go to exam; nothing is filtered by the candidate's chosen track.
 */
export function ExamChooser() {
  const [exams, setExams] = React.useState<SkillExam[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    skillExamApi
      .list()
      .then((list) => !cancelled && setExams(list))
      .catch((err: unknown) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <FormMessage>{error}</FormMessage>;
  if (!exams) {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading exams...
      </p>
    );
  }

  const byTitle = (a: SkillExam, b: SkillExam) => a.targetTitle.localeCompare(b.targetTitle);
  const domains = exams.filter((e) => e.scope === "domain").sort(byTitle);
  const courses = exams.filter((e) => e.scope === "course").sort(byTitle);
  if (domains.length === 0 && courses.length === 0) {
    return <p className="text-sm text-muted">No exams are open yet. Please check back soon.</p>;
  }

  return (
    <div className="space-y-8">
      {domains.length > 0 ? (
        <section aria-labelledby="domain-exams-heading">
          <h2 id="domain-exams-heading" className="text-lg font-bold text-navy dark:text-white">Which domain do you want to be tested on?</h2>
          <p className="mt-1 text-sm text-muted dark:text-slate-400">A domain exam covers the whole field. You can take any domain, as often as you like.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {domains.map((exam) => (
              <li
                key={exam.id}
                className="flex flex-col justify-between gap-3 rounded-xl2 border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-400/20 dark:bg-amber-400/5"
              >
                <div className="flex items-start gap-3">
                  <Award className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  <div>
                    <h3 className="font-bold text-navy dark:text-white">{exam.targetTitle}</h3>
                    <p className="mt-0.5 text-sm text-muted dark:text-slate-400">
                      {facts(exam)}
                      {exam.unlocked ? "" : " · unlocks after payment"}
                    </p>
                    <ExamStatus exam={exam} />
                  </div>
                </div>
                <div>
                  <ExamAction exam={exam} size="default" variant="primary" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {courses.length > 0 ? (
        <section aria-labelledby="course-exams-heading">
          <h2 id="course-exams-heading" className="text-lg font-bold text-navy dark:text-white">
            {domains.length > 0 ? "Or test one course" : "Course exams"}
          </h2>
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl2 border border-slate-100 dark:divide-white/10 dark:border-white/10">
            {courses.map((exam) => (
              <li key={exam.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-start gap-3">
                  <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary-blue dark:text-bright-blue" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-navy dark:text-white">{exam.targetTitle}</p>
                    <p className="text-xs text-muted dark:text-slate-400">{facts(exam)}</p>
                    <ExamStatus exam={exam} />
                  </div>
                </div>
                <ExamAction exam={exam} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
