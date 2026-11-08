import Image from "next/image";
import Link from "next/link";
import { INTERIORS_BASE, INTERIORS_CONTACT, INTERIOR_SERVICES } from "@/lib/interiors/content";

export function InteriorsFooter() {
  return (
    <footer className="border-t border-[#e4e0d4] bg-[#f6f4ee] text-[#2f3d38]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3">
            <Image src="/images/hvk-logo.png" alt="" width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
            <span className="font-[family-name:var(--font-playfair)] text-lg font-bold tracking-[0.12em] text-[#0f3b32]">HVK INTERIORS</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed">We transform spaces into beautiful, functional and affordable interiors.</p>
        </div>

        <nav aria-label="Quick links">
          <h2 className="font-[family-name:var(--font-playfair)] text-base font-bold text-[#0f3b32]">Quick Links</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              ["Home", INTERIORS_BASE],
              ["About", `${INTERIORS_BASE}/about`],
              ["Services", `${INTERIORS_BASE}/services`],
              ["Estimate your cost", `${INTERIORS_BASE}/estimate`],
              ["Portfolio", `${INTERIORS_BASE}/portfolio`],
              ["Blog", `${INTERIORS_BASE}/blog`],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href!} className="hover:text-[#b8860b]">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Services">
          <h2 className="font-[family-name:var(--font-playfair)] text-base font-bold text-[#0f3b32]">Services</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {INTERIOR_SERVICES.slice(0, 5).map((s) => (
              <li key={s.slug}>
                <Link href={`${INTERIORS_BASE}/services/${s.slug}`} className="hover:text-[#b8860b]">
                  {s.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href={`${INTERIORS_BASE}/services`} className="hover:text-[#b8860b]">
                All Services
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-base font-bold text-[#0f3b32]">Get In Touch</h2>
          <address className="mt-3 space-y-2 text-sm not-italic">
            <p>
              <a href={`mailto:${INTERIORS_CONTACT.email}`} className="hover:text-[#b8860b]">
                {INTERIORS_CONTACT.email}
              </a>
            </p>
            {INTERIORS_CONTACT.phones.map((phone) => (
              <p key={phone.href}>
                <a href={phone.href} className="hover:text-[#b8860b]">
                  {phone.label}
                </a>
              </p>
            ))}
            <p>{INTERIORS_CONTACT.address}</p>
            <p className="text-[#5b6a64]">{INTERIORS_CONTACT.hours}</p>
          </address>
        </div>
      </div>
      <p className="border-t border-[#e4e0d4] py-4 text-center text-xs text-[#5b6a64]">© {new Date().getFullYear()} HVK Tech. All rights reserved.</p>
    </footer>
  );
}
