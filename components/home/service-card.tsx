"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ServicePoster } from "@/components/services/service-poster";
import { SERVICES } from "@/lib/constants";
import { getServiceDetail } from "@/lib/service-details";
import type { ServiceItem } from "@/types";

/** A service on the registration page: its picture, then the title, a short description and a link to the detail page. */
export function ServiceCard({ id, title, description }: Pick<ServiceItem, "id" | "title" | "description">) {
  const detail = getServiceDetail(id);
  const service = SERVICES.find((s) => s.id === id);
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl2 border border-slate-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:border-white/10 dark:bg-dark-surface"
    >
      {detail && service ? (
        <div className="overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
          <ServicePoster icon={service.icon} title={service.title} tagline={service.description} accent={detail.accent} poster={detail.poster} variant="light" className="border-0" />
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
        {detail ? (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted dark:text-slate-400">{detail.cardSummary}</p>
        ) : (
          <p className="mt-2 flex-1 text-sm font-semibold leading-relaxed text-ink dark:text-slate-200">{description}</p>
        )}
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-blue dark:text-bright-blue" aria-hidden="true">
          Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </motion.article>
  );
}
