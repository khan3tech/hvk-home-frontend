import type { Metadata } from "next";
import { ThankYou } from "@/components/portal/result";

export const metadata: Metadata = { title: "Thank you | HVK Tech Online Examination" };

export default function ThankYouPage() {
  return <ThankYou />;
}
