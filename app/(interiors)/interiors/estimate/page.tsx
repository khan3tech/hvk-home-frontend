import type { Metadata } from "next";
import { Estimator } from "@/components/interiors/estimator";

export const metadata: Metadata = {
  title: "Interior cost estimate",
  description: "Enter your room sizes, choose what you need and a package, and see an itemised interior cost estimate at once.",
};

export default function EstimatePage() {
  return <Estimator />;
}
