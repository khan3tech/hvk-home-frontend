"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Loader2, PlayCircle, RefreshCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/client";
import { formatAmount } from "@/lib/razorpay";
import { usePaymentConfig } from "@/lib/use-payment-config";
import type { PaymentConfig } from "@/types/api";
import { FormMessage } from "./form-field";
import { PageShell } from "./page-shell";
import { useJourney } from "./portal-gate";

/** How often the page quietly checks whether staff approved the payment. */
export const APPROVAL_POLL_MS = 30_000;

/**
 * Online payment is switched off: the candidate pays as instructed and waits for staff to approve it.
 * When staff approve, the next check moves the candidate on (the portal routes by onboarding step).
 */
export function ManualPayment({ config, pollMs = APPROVAL_POLL_MS }: { config: PaymentConfig; pollMs?: number }) {
  const { reload } = useJourney();
  const [checking, setChecking] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const check = React.useCallback(
    async (manual: boolean) => {
      if (manual) {
        setChecking(true);
        setError(null);
        setMessage(null);
      }
      try {
        const next = await reload();
        // Still waiting: the portal keeps this page. If approved, it routes away on its own.
        if (manual && (next.step === "registered" || next.step === "demo_pending" || next.step === "fee_pending")) {
          setMessage("Not approved yet. We will unlock your videos and exam as soon as our team confirms your payment.");
        }
      } catch (err) {
        if (manual) setError(errorMessage(err));
      } finally {
        if (manual) setChecking(false);
      }
    },
    [reload],
  );

  React.useEffect(() => {
    if (pollMs <= 0) return;
    const timer = window.setInterval(() => void check(false), pollMs);
    return () => window.clearInterval(timer);
  }, [check, pollMs]);

  const lines = config.instructions.trim();
  return (
    <PageShell eyebrow="Registration fee" title="Waiting for payment approval" intro="Pay the registration fee as described below. Once our team approves your payment, your videos and exam unlock.">
      <div className="rounded-xl bg-light-blue/50 p-5 dark:bg-dark-surface-alt">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary-blue dark:text-bright-blue">Registration fee</p>
        <p className="mt-1 text-3xl font-extrabold text-navy dark:text-white">{formatAmount(config.feeMinor, config.currency)}</p>
      </div>

      <section aria-labelledby="how-to-pay" className="mt-6">
        <h2 id="how-to-pay" className="text-base font-bold text-navy dark:text-white">
          How to pay
        </h2>
        {lines ? (
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink dark:text-slate-200">{lines}</p>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">Please contact the HVK team to pay your registration fee.</p>
        )}
      </section>

      <ol className="mt-6 space-y-3 text-sm text-ink dark:text-slate-200" aria-label="What happens next">
        <li className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
          <span>You registered.</span>
        </li>
        <li className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <span>
            <strong>Pay and tell us your name and phone number.</strong> Our team approves your payment, usually within a working day.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[11px] font-bold text-muted dark:border-white/20" aria-hidden="true">
            3
          </span>
          <span>Your course videos and exam unlock.</span>
        </li>
      </ol>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => void check(true)} disabled={checking}>
          {checking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
          Check approval status
        </Button>
        <Link href="/learning" className={buttonVariants({ variant: "outline" })}>
          <PlayCircle className="h-4 w-4" aria-hidden="true" /> Watch free preview videos
        </Link>
        <p role="status" className="text-sm text-muted dark:text-slate-400">
          {message}
        </p>
      </div>
      <div className="mt-3">
        <FormMessage>{error}</FormMessage>
      </div>
    </PageShell>
  );
}

/** What the payment page and the first step show, depending on how payment works right now. */
export function PaymentSwitch({ online }: { online: React.ReactNode }) {
  const { config, failed } = usePaymentConfig();
  if (config?.mode === "manual") return <ManualPayment config={config} />;
  if (config || failed) return <>{online}</>; // an older API (no config) behaves as online payment
  return (
    <PageShell title="Loading">
      <p role="status" className="flex items-center gap-2 text-sm text-muted dark:text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading…
      </p>
    </PageShell>
  );
}
