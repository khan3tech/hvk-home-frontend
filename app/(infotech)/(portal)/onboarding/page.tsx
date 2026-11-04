import type { Metadata } from "next";
import { Learning } from "@/components/learning/learning";
import { PaymentSwitch } from "@/components/portal/manual-payment";

export const metadata: Metadata = { title: "Learn | HVK Tech Online Examination" };

export default function OnboardingPage() {
  // When payment is approved by staff, videos unlock only after approval: until then this step shows how to pay.
  return <PaymentSwitch online={<Learning />} />;
}
