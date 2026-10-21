import type { Metadata } from "next";
import { Result } from "@/components/portal/result";

export const metadata: Metadata = { title: "Result | HVK Tech innovation" };

export default function ResultPage() {
  return <Result />;
}
