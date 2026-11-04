import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import { PortalGate } from "@/components/portal/portal-gate";
import { SessionProvider } from "@/lib/session/session-provider";

export const metadata: Metadata = {
  title: "Staff portal | HVK Tech",
  robots: { index: false, follow: false },
};

/**
 * Staff area (TA and admin): its own frame, without the public site's menu, announcement bar or footer.
 * Requires a session with role ta or admin.
 */
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminHeader />
      <main id="main-content" className="flex-1">
        <PortalGate area="admin">{children}</PortalGate>
      </main>
    </SessionProvider>
  );
}
