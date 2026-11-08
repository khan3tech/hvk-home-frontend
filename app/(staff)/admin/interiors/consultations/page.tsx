import type { Metadata } from "next";
import { InteriorConsultations } from "@/components/admin/interiors/interior-consultations";

export const metadata: Metadata = { title: "Interiors consultations | Staff portal" };

export default function InteriorConsultationsPage() {
  return <InteriorConsultations />;
}
