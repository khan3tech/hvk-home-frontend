import type { Metadata } from "next";
import { ManagedExamInvite } from "@/components/portal/managed-exam-invite";

export const metadata: Metadata = { title: "Examination | HVK Tech innovation", robots: { index: false, follow: false } };

export default function ExamInvitePage() {
  return <ManagedExamInvite />;
}
