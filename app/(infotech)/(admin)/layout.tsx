import type { Metadata } from "next";
import { PortalGate } from "@/components/portal/portal-gate";

export const metadata: Metadata = {
  title: "TA dashboard | HVK Infotech",
  robots: { index: false, follow: false },
};

/** TA/admin area: requires a session with role ta or admin. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PortalGate area="admin">{children}</PortalGate>;
}
