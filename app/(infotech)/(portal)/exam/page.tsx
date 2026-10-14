import type { Metadata } from "next";
import { Exam } from "@/components/portal/exam";

export const metadata: Metadata = { title: "Exam | HVK Infotech" };

export default function ExamPage() {
  return <Exam />;
}
