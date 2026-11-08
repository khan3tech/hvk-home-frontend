"use client";

import * as React from "react";
import { useOptionalSession } from "@/lib/session/session-provider";
import { cn } from "@/lib/utils";

const SAMPLE_NAME = "Kabir Rao";
const MAX_NAME = 40;

/** Date shown on the sample, e.g. "27 October 2026". */
const todayLabel = () => new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

/**
 * A sample HVK completion certificate. It shows the signed-in user's name (or a dummy name), and lets
 * visitors try another name and programme. It is drawn as an SVG so it scales cleanly and prints well.
 * The "SAMPLE" watermark makes sure it can never be mistaken for a real certificate.
 */
export function CertificatePreview({ programmes }: { programmes: string[] }) {
  const session = useOptionalSession();
  const accountName = session?.status === "authenticated" ? session.candidate?.fullName?.trim() : undefined;
  const [typed, setTyped] = React.useState<string | null>(null);
  const [programme, setProgramme] = React.useState(programmes[0] ?? "");
  const name = (typed ?? accountName ?? SAMPLE_NAME).trim() || SAMPLE_NAME;
  const source = typed !== null ? "the name you typed" : accountName ? "your name from your account" : "a sample name; sign in to see yours";

  // Long names are squeezed to fit the line instead of running off the certificate.
  const nameWidth = Math.min(560, name.length * 30);
  const squeeze = name.length * 30 > 560;

  return (
    <div>
      <figure className="m-0">
        <svg
          viewBox="0 0 842 595"
          role="img"
          aria-label={`Sample certificate of completion for ${name}, ${programme}`}
          className="w-full rounded-lg bg-white shadow-card-hover"
        >
          <rect width="842" height="595" fill="#fffdf7" />
          <rect x="18" y="18" width="806" height="559" fill="none" stroke="#0b1f3a" strokeWidth="6" />
          <rect x="32" y="32" width="778" height="531" fill="none" stroke="#b8923c" strokeWidth="2" />
          {[
            [32, 32],
            [810, 32],
            [32, 563],
            [810, 563],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill="#b8923c" />
          ))}

          <text x="421" y="300" textAnchor="middle" fontSize="150" fontWeight="800" fill="#0b1f3a" opacity="0.045" transform="rotate(-24 421 300)" fontFamily="Arial, sans-serif">
            SAMPLE
          </text>

          <defs>
            <clipPath id="certificate-logo-clip">
              <circle cx="421" cy="92" r="40" />
            </clipPath>
          </defs>
          <image href="/images/hvk-logo.png" x="381" y="52" width="80" height="80" clipPath="url(#certificate-logo-clip)" />
          <text x="421" y="158" textAnchor="middle" fontSize="15" letterSpacing="4" fill="#0b1f3a" fontFamily="Arial, sans-serif" fontWeight="700">
            HVK TECH ONLINE EXAMINATION
          </text>
          <text x="421" y="214" textAnchor="middle" fontSize="40" fill="#0b1f3a" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700">
            Certificate of Completion
          </text>
          <line x1="301" y1="232" x2="541" y2="232" stroke="#b8923c" strokeWidth="2" />
          <text x="421" y="268" textAnchor="middle" fontSize="15" fill="#475569" fontFamily="Georgia, serif" fontStyle="italic">
            This certificate is proudly presented to
          </text>
          <text
            x="421"
            y="328"
            textAnchor="middle"
            fontSize="46"
            fill="#1d4ed8"
            fontFamily="'Brush Script MT', 'Segoe Script', 'Lucida Handwriting', cursive"
            {...(squeeze ? { textLength: nameWidth, lengthAdjust: "spacingAndGlyphs" } : {})}
            suppressHydrationWarning
          >
            {name}
          </text>
          <line x1="221" y1="342" x2="621" y2="342" stroke="#94a3b8" strokeWidth="1" />
          <text x="421" y="376" textAnchor="middle" fontSize="15" fill="#475569" fontFamily="Georgia, serif" fontStyle="italic">
            for successfully completing the programme
          </text>
          <text x="421" y="414" textAnchor="middle" fontSize="26" fill="#0b1f3a" fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700">
            {programme}
          </text>

          <text x="150" y="500" textAnchor="middle" fontSize="13" fill="#0b1f3a" fontFamily="Arial, sans-serif" fontWeight="700" suppressHydrationWarning>
            {todayLabel()}
          </text>
          <line x1="70" y1="508" x2="230" y2="508" stroke="#0b1f3a" strokeWidth="1" />
          <text x="150" y="526" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="Arial, sans-serif">
            DATE OF ISSUE
          </text>

          <g transform="translate(421 478)">
            <circle r="42" fill="#b8923c" />
            <circle r="35" fill="none" stroke="#fffdf7" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M0 -20 L5.9 -6.2 L20.9 -5.7 L9.5 4 L13.1 18.4 L0 10.7 L-13.1 18.4 L-9.5 4 L-20.9 -5.7 L-5.9 -6.2 Z" fill="#fffdf7" />
          </g>

          <text x="692" y="500" textAnchor="middle" fontSize="15" fill="#0b1f3a" fontFamily="'Brush Script MT', 'Segoe Script', cursive">
            Director, HVK Tech
          </text>
          <line x1="612" y1="508" x2="772" y2="508" stroke="#0b1f3a" strokeWidth="1" />
          <text x="692" y="526" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="Arial, sans-serif">
            AUTHORISED SIGNATORY
          </text>
          <text x="421" y="552" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="Arial, sans-serif" letterSpacing="1">
            CERTIFICATE ID: HVK-SAMPLE-000123
          </text>
        </svg>
        <figcaption className="mt-3 text-xs leading-relaxed text-muted dark:text-slate-400">
          Sample for illustration only. The certificate you receive is issued by HVK Tech when you meet the pass criteria, and its layout may differ.
        </figcaption>
      </figure>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="certificate-name" className="block text-sm font-semibold text-navy dark:text-white">
            Preview with your name
          </label>
          <input
            id="certificate-name"
            type="text"
            maxLength={MAX_NAME}
            value={typed ?? accountName ?? ""}
            placeholder={SAMPLE_NAME}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink focus:border-bright-blue focus:outline-none focus:ring-2 focus:ring-bright-blue/20 dark:border-white/10 dark:bg-dark-surface-alt dark:text-slate-100"
          />
          <p className="mt-1 text-xs text-muted dark:text-slate-400" role="status">
            Showing {source}.
          </p>
        </div>
        {programmes.length > 1 ? (
          <fieldset>
            <legend className="text-sm font-semibold text-navy dark:text-white">Programme</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {programmes.map((item) => (
                <label
                  key={item}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-bright-blue",
                    item === programme
                      ? "border-primary-blue bg-primary-blue text-white"
                      : "border-slate-200 text-ink hover:border-primary-blue dark:border-white/20 dark:text-slate-200",
                  )}
                >
                  <input type="radio" name="certificate-programme" value={item} checked={item === programme} onChange={() => setProgramme(item)} className="sr-only" />
                  {item}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
      </div>
    </div>
  );
}
