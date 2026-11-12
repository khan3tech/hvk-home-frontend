"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, X } from "lucide-react";
import type { PaymentConfig } from "@/types/api";
import { Button, buttonVariants } from "@/components/ui/button";

interface PaymentPromptApi {
  /** True until the registration fee is paid (or approved): the rest of the videos and the exams are locked. */
  locked: boolean;
  /** Shows the "pay to continue" popup. */
  open(): void;
}

const PaymentPromptContext = React.createContext<PaymentPromptApi | null>(null);

/** Outside the candidate portal nothing is locked, so callers can use this anywhere. */
export function usePaymentPrompt(): PaymentPromptApi {
  return React.useContext(PaymentPromptContext) ?? { locked: false, open: () => undefined };
}

/**
 * The popup a candidate sees after the free first videos: when they finish one, try to open a locked video, or try to go to an
 * exam before paying. It shows the registration fee and a button to the payment page (spec 006, D6).
 */
export function PaymentPromptProvider({ config, locked, children }: { config: PaymentConfig | null; locked: boolean; children: React.ReactNode }) {
  const [shown, setShown] = React.useState(false);
  const api = React.useMemo<PaymentPromptApi>(() => ({ locked, open: () => setShown(true) }), [locked]);

  return (
    <PaymentPromptContext.Provider value={api}>
      {children}
      {shown ? <PaymentDialog config={config} onClose={() => setShown(false)} /> : null}
    </PaymentPromptContext.Provider>
  );
}

/** "₹2,999" for whole rupees, "₹2,999.50" otherwise. */
function fee(config: PaymentConfig): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: config.currency, maximumFractionDigits: config.feeMinor % 100 === 0 ? 0 : 2 }).format(config.feeMinor / 100);
}

function PaymentDialog({ config, onClose }: { config: PaymentConfig | null; onClose: () => void }) {
  const ref = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="payment-prompt-title"
      aria-describedby="payment-prompt-text"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-navy/70 dark:bg-dark-surface"
    >
      <div className="relative p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-blue dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-light-blue text-primary-blue dark:bg-bright-blue/10 dark:text-bright-blue">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 id="payment-prompt-title" className="mt-4 text-xl font-extrabold text-navy dark:text-white">
          Unlock all videos and exams
        </h2>
        {config ? (
          <p className="mt-3 text-3xl font-extrabold text-primary-blue dark:text-bright-blue" data-testid="prompt-fee">
            {fee(config)}
          </p>
        ) : null}
        <p id="payment-prompt-text" className="mt-3 text-sm leading-relaxed text-muted dark:text-slate-300">
          You have seen the free preview. Pay the registration fee once to watch every video of every course and to take the course and domain exams.
          {config?.mode === "manual" ? " On the next page you will see how to pay. Our team approves your payment, usually within a working day." : ""}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/payment" onClick={onClose} className={buttonVariants({ size: "lg" })}>
            Pay{config ? ` ${fee(config)}` : " now"}
          </Link>
          <Button variant="outline" size="lg" onClick={onClose}>
            Not now
          </Button>
        </div>
      </div>
    </dialog>
  );
}
