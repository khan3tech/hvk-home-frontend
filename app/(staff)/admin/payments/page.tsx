import type { Metadata } from "next";
import { Payments } from "@/components/admin/payments";

export const metadata: Metadata = { title: "Payments | Staff portal" };

export default function PaymentsPage() {
  return <Payments />;
}
