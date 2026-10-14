import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/portal/password-reset-forms";

export const metadata: Metadata = { title: "Forgot password | HVK Infotech" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
