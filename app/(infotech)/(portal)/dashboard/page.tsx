import type { Metadata } from "next";
import { Dashboard } from "@/components/portal/dashboard";

export const metadata: Metadata = { title: "My dashboard | HVK Infotech" };

export default function DashboardPage() {
  return <Dashboard />;
}
