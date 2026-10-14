import type { Metadata } from "next";
import { Profile } from "@/components/portal/profile";

export const metadata: Metadata = { title: "My profile | HVK Infotech" };

export default function ProfilePage() {
  return <Profile />;
}
