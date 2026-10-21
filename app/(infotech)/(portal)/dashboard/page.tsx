import type { Metadata } from "next";
import { Dashboard } from "@/components/portal/dashboard";

export const metadata: Metadata = { title: "My dashboard | HVK Tech innovation" };

export default function DashboardPage() {
  return <Dashboard />;
}
