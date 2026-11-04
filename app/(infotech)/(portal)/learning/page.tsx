import type { Metadata } from "next";
import { Learning } from "@/components/learning/learning";

export const metadata: Metadata = { title: "My learning | HVK Tech Online Examination" };

/** The course videos, once the registration fee is paid (or approved by staff). */
export default function LearningPage() {
  return <Learning hub />;
}
