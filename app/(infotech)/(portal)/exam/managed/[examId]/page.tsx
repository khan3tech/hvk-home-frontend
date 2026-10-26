import type { Metadata } from "next";
import { ManagedExamInvite } from "@/components/portal/managed-exam-invite";

export const metadata: Metadata = { title: "Online examination | HVK Infotech" };

export default async function ManagedExamByIdPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  return <ManagedExamInvite examId={examId} />;
}
