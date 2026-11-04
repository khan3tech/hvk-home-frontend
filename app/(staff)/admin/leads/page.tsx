import { Suspense } from "react";
import { LeadsList } from "@/components/admin/leads-list";
import { StatusCard } from "@/components/portal/status-card";

export default function LeadsPage() {
  return (
    <Suspense fallback={<StatusCard tone="loading" title="Loading…" />}>
      <LeadsList />
    </Suspense>
  );
}
