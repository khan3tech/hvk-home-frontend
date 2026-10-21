import type { Metadata } from "next";
import { DemoVideo } from "@/components/portal/demo-video";

export const metadata: Metadata = { title: "Demo | HVK Tech innovation" };

export default function OnboardingPage() {
  return <DemoVideo />;
}
