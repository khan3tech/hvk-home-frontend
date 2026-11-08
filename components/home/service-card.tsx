"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { getServiceDetail } from "@/lib/service-details";
import type { ServiceItem } from "@/types";

/** A service on the registration page: its picture, then the title, a short description and a link to the detail page. */
export function ServiceCard({ id, title, description }: Pick<ServiceItem, "id" | "title" | "description">) {
  const detail = getServiceDetail(id);
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl2 border border-slate-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:border-white/10 dark:bg-dark-surface"
    >
      {detail ? (
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={detail.photo.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Brand tint in the service's colours so the photos read as one set. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 opacity-35 mix-blend-multiply"
            style={{ backgroundImage: `linear-gradient(135deg, ${detail.accent[0]}, ${detail.accent[1]})` }}
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-bold text-navy dark:text-white">
          {/* The link's ::after covers the whole card, so the entire card is clickable. */}
          <Link
            href={`/services/${id}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-bright-blue"
          >
            {title}
          </Link>
        </h3>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-ink dark:text-slate-200">{description}</p>
        {detail ? <p className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">{detail.cardSummary}</p> : null}
        {detail ? (
          <ul className="mt-4 flex flex-1 flex-wrap content-start gap-2" aria-label="Highlights">
            {detail.badges.map((badge) => (
              <li key={badge} className="rounded-full bg-light-blue px-3 py-1 text-xs font-semibold text-primary-blue dark:bg-bright-blue/10 dark:text-bright-blue">
                {badge}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex-1" />
        )}
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-blue dark:text-bright-blue" aria-hidden="true">
          Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </motion.article>
  );
}
