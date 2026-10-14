import type { Metadata } from "next";
import { ThankYou } from "@/components/portal/result";

export const metadata: Metadata = { title: "Thank you | HVK Infotech" };

export default function ThankYouPage() {
  return <ThankYou />;
}
