import type { Metadata } from "next";
import { ExamResults } from "@/components/admin/exam-results";

export const metadata: Metadata = { title: "Exam results | Staff portal" };

export default function ExamResultsPage() {
  return <ExamResults />;
}
