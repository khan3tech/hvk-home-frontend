import type { Metadata } from "next";
import { SkillExams } from "@/components/admin/skill-exams";

export const metadata: Metadata = { title: "Course and domain exams | Staff portal" };

export default function SkillExamsPage() {
  return <SkillExams />;
}
