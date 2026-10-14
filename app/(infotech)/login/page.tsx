import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/portal/login-form";
import { StatusCard } from "@/components/portal/status-card";

export const metadata: Metadata = { title: "Sign in | HVK Infotech" };

export default function LoginPage() {
  return (
    <Suspense fallback={<StatusCard tone="loading" title="Loading…" />}>
      <LoginForm />
    </Suspense>
  );
}
