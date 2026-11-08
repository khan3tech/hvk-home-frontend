import type { Metadata } from "next";
import { InteriorRateCard } from "@/components/admin/interiors/interior-rate-card";

export const metadata: Metadata = { title: "Interiors rate card | Staff portal" };

export default function InteriorRateCardPage() {
  return <InteriorRateCard />;
}
