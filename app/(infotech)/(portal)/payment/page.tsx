import type { Metadata } from "next";
import { PaymentSwitch } from "@/components/portal/manual-payment";
import { Payment } from "@/components/portal/payment";

export const metadata: Metadata = { title: "Registration fee | HVK Tech Online Examination" };

export default function PaymentPage() {
  return <PaymentSwitch online={<Payment />} />;
}
