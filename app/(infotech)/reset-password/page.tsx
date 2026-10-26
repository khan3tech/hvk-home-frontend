import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/portal/password-reset-forms";
import { StatusCard } from "@/components/portal/status-card";

export const metadata: Metadata = {
  title: "Reset password | HVK Tech Online Examination",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<StatusCard tone="loading" title="Loading…" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
