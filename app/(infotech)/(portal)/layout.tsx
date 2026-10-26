import type { Metadata } from "next";
import { PortalGate } from "@/components/portal/portal-gate";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Candidate portal: requires a session and routes by onboarding step. */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalGate area="candidate">{children}</PortalGate>;
}
