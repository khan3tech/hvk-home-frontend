import type { Metadata } from "next";
import { Feedback } from "@/components/portal/feedback";

export const metadata: Metadata = { title: "Feedback | HVK Tech Online Examination" };

export default function FeedbackPage() {
  return <Feedback />;
}
