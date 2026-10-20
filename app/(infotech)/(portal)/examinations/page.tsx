import type { Metadata } from "next";
import { ManagedExamList } from "@/components/portal/managed-exam-list";

export const metadata: Metadata = { title: "My examinations | HVK Infotech" };

export default function ManagedExaminationsPage() {
  return <ManagedExamList />;
}
