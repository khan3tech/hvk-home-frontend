import type { Metadata } from "next";
import Link from "next/link";
import { Visual, SectionTitle, interiorsButton } from "@/components/interiors/ui";
import { INTERIORS_BASE, INTERIOR_PROCESS } from "@/lib/interiors/content";

export const metadata: Metadata = { title: "About us", description: "HVK Interiors turns spaces into beautiful, functional and affordable interiors." };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <SectionTitle>About Us</SectionTitle>
          <p className="mt-6 font-[family-name:var(--font-playfair)] text-lg italic text-[#0f3b32]">&ldquo;Transforming Spaces Into Beautiful Experiences&rdquo;</p>
          <p className="mt-4 text-sm leading-relaxed">
            We transform spaces into beautiful, functional and affordable interiors. Our platform helps homeowners and designers explore styles, compare pricing and plan budgets to create spaces that perfectly balance style, comfort and quality.
          </p>
          <p className="mt-3 text-sm leading-relaxed">
            HVK Interiors is part of HVK Tech. Design, carpentry, site work and finishing are handled by one team, so you have one person to talk to and one plan to follow.
          </p>
          <Link href={`${INTERIORS_BASE}/estimate`} className={`${interiorsButton} mt-6`}>
            Estimate your interiors
          </Link>
        </div>
        <Visual alt="Warm living room with natural textures" index={2} icon="sofa" className="aspect-[4/3] rounded-lg" />
      </div>
      <section aria-labelledby="how-title" className="mt-16">
        <h2 id="how-title" className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#0f3b32]">
          How we work
        </h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-5">
          {INTERIOR_PROCESS.map((step, i) => (
            <li key={step.title} className="rounded-lg bg-white p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e0a826] text-xs font-bold text-[#0f3b32]">{i + 1}</span>
              <h3 className="mt-2 text-sm font-bold text-[#0f3b32]">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
