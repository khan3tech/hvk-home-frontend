import Link from "next/link";
import { Instagram, Linkedin, Youtube } from "lucide-react";
import { TECH_FOOTER_GROUPS, TECH_SOCIAL_LINKS } from "@/lib/tech-constants";
import { TechBrand } from "./tech-brand";
import { TechSubscribe } from "./tech-subscribe";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.9 2H22l-6.8 7.8L23 22h-6.1l-4.8-6.3L6.6 22H3.5l7.3-8.3L1 2h6.3l4.3 5.7L18.9 2Zm-1.1 18.2h1.7L6.3 3.7H4.5l13.3 16.5Z" />
    </svg>
  );
}

const SOCIAL_ICONS = {
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  x: XIcon,
};

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const className = "block py-1 text-xs text-tech-muted transition-colors hover:text-gold-light";
  return href.startsWith("/") ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export function TechFooter() {
  return (
    <footer className="bg-tech-bg pt-12">
      <div className="tech-container">
        <div className="grid grid-cols-2 gap-8 pb-10 md:grid-cols-3 lg:grid-cols-[1.6fr_0.8fr_1fr_0.9fr_1.5fr]">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <div className="flex items-start gap-5">
              <TechBrand className="[&_img]:h-16 [&_img]:w-16" />
              <p className="max-w-[16rem] text-xs leading-relaxed text-tech-muted">
                Creating experiences, solutions and opportunities across six specialized
                capabilities. Together, we build a brighter tomorrow.
              </p>
            </div>
            <ul className="mt-6 flex gap-4">
              {TECH_SOCIAL_LINKS.map((social) => {
                const Icon = SOCIAL_ICONS[social.icon];
                return (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="text-white transition-colors hover:text-gold-light"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {TECH_FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-3 text-sm font-medium text-white">{group.title}</h3>
              {group.links.map((link) => (
                <FooterLink key={link.label} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </div>
          ))}

          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <h3 className="text-sm font-medium text-white">Subscribe to Updates</h3>
            <p className="mt-2 text-xs text-tech-muted">
              Get the latest news and updates from HVK.
            </p>
            <TechSubscribe />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-5 text-xs text-tech-muted md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} HVK. All rights reserved.</span>
          <span className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-gold-light">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gold-light">
              Terms &amp; Conditions
            </Link>
          </span>
          <span>Made with purpose. For a brighter tomorrow.</span>
        </div>
      </div>
    </footer>
  );
}
