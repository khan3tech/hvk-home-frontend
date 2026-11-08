"use client";

import * as React from "react";
import Link from "next/link";
import { INTERIORS_BASE, INTERIOR_PROJECTS, PROJECT_ROOMS, PROJECT_STYLES } from "@/lib/interiors/content";
import { cn } from "@/lib/utils";
import { Visual } from "./ui";

function Chips({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (value: string) => void }) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold uppercase tracking-wide text-[#4a5a54]">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {["All", ...options].map((option) => (
          <label key={option} className={cn("cursor-pointer rounded-full border px-3 py-1 text-sm", value === option ? "border-[#0f3b32] bg-[#0f3b32] text-white" : "border-[#cfd6cf] bg-white")}>
            <input type="radio" name={label} className="sr-only" checked={value === option} onChange={() => onChange(option)} />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Projects with filters by room and style. */
export function PortfolioGallery() {
  const [room, setRoom] = React.useState("All");
  const [style, setStyle] = React.useState("All");
  const shown = INTERIOR_PROJECTS.filter((p) => (room === "All" || p.room === room) && (style === "All" || p.style === style));

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Chips label="Room" options={PROJECT_ROOMS} value={room} onChange={setRoom} />
        <Chips label="Style" options={PROJECT_STYLES} value={style} onChange={setStyle} />
      </div>
      <p role="status" className="mt-6 text-sm text-[#4a5a54]">
        {shown.length} project{shown.length === 1 ? "" : "s"}
      </p>
      {shown.length === 0 ? (
        <p className="mt-6 rounded-md bg-white p-6 text-sm">No projects match these filters yet. Try another combination.</p>
      ) : (
        <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((project, index) => (
            <li key={project.slug} className="overflow-hidden rounded-lg border border-[#d8dcd2] bg-white">
              <Visual image={project.image} alt={project.title} index={index} className="aspect-[4/3]" />
              <div className="p-4">
                <h3 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[#0f3b32]">{project.title}</h3>
                <p className="mt-1 text-xs text-[#4a5a54]">
                  {project.room} · {project.style} · {project.areaSqft} sq ft · {project.city}
                </p>
                <p className="mt-2 text-sm">{project.summary}</p>
                <Link href={`${INTERIORS_BASE}/estimate`} className="mt-3 inline-block text-xs font-semibold uppercase tracking-wide text-[#0f3b32] hover:text-[#b8860b]">
                  Estimate a similar space →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
