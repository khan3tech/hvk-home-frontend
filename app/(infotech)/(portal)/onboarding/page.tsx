import type { Metadata } from "next";
import { Learning } from "@/components/learning/learning";

export const metadata: Metadata = { title: "Learn | HVK Tech Online Examination" };

export default function OnboardingPage() {
  return <Learning />;
}
