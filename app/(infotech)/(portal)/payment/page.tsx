import type { Metadata } from "next";
import { Payment } from "@/components/portal/payment";

export const metadata: Metadata = { title: "Registration fee | HVK Tech Online Examination" };

export default function PaymentPage() {
  return <Payment />;
}
