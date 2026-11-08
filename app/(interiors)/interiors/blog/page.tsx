import type { Metadata } from "next";
import Link from "next/link";
import { SectionTitle, interiorsButton } from "@/components/interiors/ui";
import { INTERIORS_BASE } from "@/lib/interiors/content";

export const metadata: Metadata = { title: "Blog", description: "Interior design guides and ideas from HVK Interiors, coming soon." };

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20 text-center">
      <SectionTitle>Blog</SectionTitle>
      <p className="mt-6 text-sm leading-relaxed">Buying guides, cost breakdowns and design ideas are on their way. Meanwhile, you can work out what your own interiors might cost.</p>
      <Link href={`${INTERIORS_BASE}/estimate`} className={`${interiorsButton} mt-6`}>
        Estimate your interiors
      </Link>
    </div>
  );
}
