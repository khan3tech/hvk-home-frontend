import type { Metadata } from "next";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/constants";
import { PRIVACY_SECTIONS } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  robots: { index: false, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <section className="bg-app-bg py-16 dark:bg-dark-bg sm:py-20">
      <div className="container max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary-blue dark:text-bright-blue">
          Legal
        </span>
        <h1 className="mt-2 text-2xl font-extrabold text-navy dark:text-white sm:text-3xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted dark:text-slate-400">
          This Privacy Policy explains how {SITE_NAME} collects, uses, and protects
          the personal information you share with us through our website.
        </p>

        <div className="mt-10 space-y-8">
          {PRIVACY_SECTIONS.map((section) => (
            <div key={section.heading}>
              <h2 className="text-lg font-bold text-navy dark:text-white">
                {section.heading}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">
                {section.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-100 pt-6 dark:border-white/10">
          <h2 className="text-lg font-bold text-navy dark:text-white">Contact Us</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">
            If you have questions about this Privacy Policy, please reach out to us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-primary-blue hover:underline dark:text-bright-blue"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
