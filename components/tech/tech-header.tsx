"use client";

import * as React from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { TECH_NAV_LINKS } from "@/lib/tech-constants";
import { cn } from "@/lib/utils";
import { TechBrand } from "./tech-brand";
import { techButtonClass } from "./tech-ui";

export function TechHeader() {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(TECH_NAV_LINKS[0].href);

  // Highlight the nav link for the section currently in view.
  React.useEffect(() => {
    const sections = TECH_NAV_LINKS.map((link) =>
      document.querySelector<HTMLElement>(link.href)
    ).filter((section): section is HTMLElement => section !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-tech-bg/85 backdrop-blur-md">
      <div className="tech-container flex h-[76px] items-center justify-between gap-6">
        <TechBrand />

        <nav
          id="tech-nav"
          aria-label="Main navigation"
          className={cn(
            "absolute inset-x-0 top-[76px] flex-col border-b border-white/10 bg-tech-bg px-6 pb-6 pt-2",
            "md:static md:mr-auto md:flex md:flex-row md:items-center md:gap-8 md:border-0 md:bg-transparent md:p-0 lg:ml-10",
            open ? "flex" : "hidden"
          )}
        >
          {TECH_NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={active === link.href ? "true" : undefined}
              className={cn(
                "relative py-3 text-[0.95rem] transition-colors hover:text-gold-light md:py-1 md:text-sm",
                active === link.href ? "text-white" : "text-tech-soft",
                "md:after:absolute md:after:inset-x-0 md:after:-bottom-1 md:after:h-px md:after:bg-gold md:after:transition-transform",
                active === link.href ? "md:after:scale-x-100" : "md:after:scale-x-0"
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a href="#contact" className={cn(techButtonClass, "hidden sm:inline-flex")}>
            Let&apos;s Talk <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <button
            type="button"
            className="rounded-full border border-white/20 p-2.5 text-white md:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="tech-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
