import * as React from "react";
import Link from "next/link";
import { HelpCircle, Phone } from "lucide-react";
import { PHONE_NUMBERS, SOCIAL_LINKS } from "@/lib/constants";

export function AnnouncementBar() {
  return (
    <div className="bg-light-blue text-ink dark:bg-navy dark:text-white">
      <div className="container flex h-9 items-center justify-between gap-4 text-xs sm:text-sm">
        <p className="truncate font-medium">
          <span className="hidden sm:inline">
            Empowering Talent. Building Careers. Join HVK Tech Online Examination Today!
          </span>
          <span className="sm:hidden">Join HVK Tech Online Examination Today!</span>
        </p>
        <div className="flex items-center gap-3 sm:gap-4">
          <ul className="hidden items-center gap-3 md:flex" aria-label="Social media links">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="text-muted transition-colors hover:text-primary-blue dark:text-white/80 dark:hover:text-bright-blue"
                >
                  <social.icon className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          <span className="hidden h-4 w-px bg-navy/15 dark:bg-white/20 md:block" aria-hidden="true" />
          <Link
            href="#contact"
            className="hidden items-center gap-1.5 text-muted transition-colors hover:text-primary-blue dark:text-white/80 dark:hover:text-bright-blue lg:flex"
          >
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Need Help?
          </Link>
          <span className="flex items-center gap-1.5 font-semibold text-navy dark:text-white">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            {PHONE_NUMBERS.map((p, i) => (
              <React.Fragment key={p.href}>
                {i > 0 ? <span className="hidden text-muted sm:inline" aria-hidden="true">/</span> : null}
                <a href={p.href} className={`whitespace-nowrap transition-colors hover:text-primary-blue dark:hover:text-bright-blue${i > 0 ? " hidden sm:inline" : ""}`}>
                  {p.label}
                </a>
              </React.Fragment>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
