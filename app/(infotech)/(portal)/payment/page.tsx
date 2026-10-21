import type { Metadata } from "next";
import { Payment } from "@/components/portal/payment";

export const metadata: Metadata = { title: "Registration fee | HVK Tech innovation" };

export default function PaymentPage() {
  return <Payment />;
}
