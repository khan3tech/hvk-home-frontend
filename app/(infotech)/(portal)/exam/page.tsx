import type { Metadata } from "next";
import { Exam } from "@/components/portal/exam";

export const metadata: Metadata = { title: "Exam | HVK Tech innovation" };

export default function ExamPage() {
  return <Exam />;
}
