import type { Metadata } from "next";
import { SkillExamRunner } from "@/components/portal/skill-exam-runner";

export const metadata: Metadata = { title: "Exam | HVK Tech Online Examination" };

export default async function SkillExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  return <SkillExamRunner examId={examId} />;
}
