import type { Metadata } from "next";
import { InteriorQuotes } from "@/components/admin/interiors/interior-quotes";

export const metadata: Metadata = { title: "Interiors quotes | Staff portal" };

export default function InteriorQuotesPage() {
  return <InteriorQuotes />;
}
