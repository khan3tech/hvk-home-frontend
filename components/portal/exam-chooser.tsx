"use client";

import * as React from "react";
import { Award, Loader2 } from "lucide-react";
import type { SkillExam } from "@/types/api";
import { ExamAction, ExamStatus, examFacts } from "@/components/learning/skill-exam-cards";
import { skillExamApi } from "@/lib/api/skill-exams";
import { errorMessage } from "@/lib/api/client";
import { FormMessage } from "./form-field";

const facts = examFacts;

/**
 * "Which domain do you want to take test?": one exam per learning path, grouped by domain.
 * Shown when a candidate clicks Go to exam.
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

  // One exam per learning path, grouped under its domain (e.g. Full Stack Development: MERN Stack, MEAN Stack).
  const paths = exams.filter((e) => e.scope === "track");
  if (paths.length === 0) return <p className="text-sm text-muted">No exams are open yet. Please check back soon.</p>;
  const domains = [...new Set(paths.map((e) => e.domain || "Other"))];

  return (
    <section aria-labelledby="domain-exams-heading">
      <h2 id="domain-exams-heading" className="text-lg font-bold text-navy dark:text-white">Which domain do you want to take test?</h2>
      <div className="mt-4 space-y-6">
        {domains.map((domain) => (
          <div key={domain} role="group" aria-label={domain}>
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted dark:text-slate-400">{domain}</h3>
            <ul className="mt-2 grid gap-3 sm:grid-cols-2">
              {paths
                .filter((e) => (e.domain || "Other") === domain)
                .map((exam) => (
                  <li
                    key={exam.id}
                    className="flex flex-col justify-between gap-3 rounded-xl2 border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-400/20 dark:bg-amber-400/5"
                  >
                    <div className="flex items-start gap-3">
                      <Award className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                      <div>
                        <h4 className="font-bold text-navy dark:text-white">{exam.targetTitle}</h4>
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
          </div>
        ))}
      </div>
    </section>
  );
}
