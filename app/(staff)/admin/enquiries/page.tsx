import type { Metadata } from "next";
import { Enquiries } from "@/components/admin/enquiries";

export const metadata: Metadata = { title: "Enquiries | Staff portal" };

export default function EnquiriesPage() {
  return <Enquiries />;
}
