import type { Metadata } from "next";
import { AdminExams } from "@/components/admin/exams";

export const metadata: Metadata = { title: "Examinations | HVK Infotech", robots: { index: false, follow: false } };

export default function AdminExamsPage() {
  return <AdminExams />;
}
