"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import type { CreateOrderResult } from "@/types/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { portalApi, type CheckoutResponse } from "@/lib/api/portal";
import { ApiError, errorMessage } from "@/lib/api/client";
import { formatAmount, loadRazorpay, openCheckout } from "@/lib/razorpay";
import { cn } from "@/lib/utils";
import { FormMessage } from "./form-field";
import { PageShell } from "./page-shell";
import { useJourney } from "./portal-gate";

type State =
  | { kind: "loading" }
  | { kind: "ready"; notice?: string }
  | { kind: "checkout" }
  | { kind: "verifying" }
  | { kind: "confirming" }
  | { kind: "success" }
  | { kind: "error"; message: string; retry: "order" | "checkout" | "none" };

/** Concurrent mounts (React StrictMode, route remounts) share one in-flight order request. */
let inflightOrder: Promise<CreateOrderResult> | null = null;
function createOrderOnce(): Promise<CreateOrderResult> {
  inflightOrder ??= portalApi.createOrder().finally(() => {
    inflightOrder = null;
  });
  return inflightOrder;
}

/** How long to keep checking for a webhook-confirmed payment after verification failed. */
export const CONFIRM_POLL_MS = 3_000;
export const CONFIRM_TIMEOUT_MS = 60_000;

export interface PaymentProps {
  /** Overridable for tests; production uses the defaults. */
  confirmPollMs?: number;
  confirmTimeoutMs?: number;
  scriptTimeoutMs?: number;
}

export function Payment({
  confirmPollMs = CONFIRM_POLL_MS,
  confirmTimeoutMs = CONFIRM_TIMEOUT_MS,
  scriptTimeoutMs = 15_000,
}: PaymentProps = {}) {
  const router = useRouter();
  const journey = useJourney();
  const [order, setOrder] = React.useState<CreateOrderResult | null>(null);
  const [state, setState] = React.useState<State>({ kind: "loading" });

  const loadOrder = React.useCallback(async () => {
    setState({ kind: "loading" });
    try {
      setOrder(await portalApi.createOrder());
      setState({ kind: "ready" });
    } catch (err) {
      if (err instanceof ApiError && err.code === "INVALID_STATE") {
        // Already paid or not at the fee step: let the journey router take over.
        await journey.reload();
        return;
      }
      setState({ kind: "error", message: errorMessage(err), retry: "order" });
    }
  }, [journey]);

  const { reload } = journey;
  React.useEffect(() => {
    let cancelled = false;
    createOrderOnce()
      .then((o) => {
        if (cancelled) return;
        setOrder(o);
        setState({ kind: "ready" });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === "INVALID_STATE") void reload();
        else setState({ kind: "error", message: errorMessage(err), retry: "order" });
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  /** After a verification problem, the webhook may still confirm the payment: poll for it. */
  const confirmViaPolling = React.useCallback(async () => {
    setState({ kind: "confirming" });
    const deadline = Date.now() + confirmTimeoutMs;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, confirmPollMs));
      try {
        const payments = await portalApi.myPayments();
        if (payments.some((p) => p.status === "paid")) {
          setState({ kind: "success" });
          return;
        }
      } catch {
        // keep polling until the deadline
      }
    }
    setState({
      kind: "error",
      retry: "none",
      message:
        "We couldn't confirm your payment yet. If money was debited, it will be confirmed automatically — please check your email or contact support with your registered email.",
    });
  }, [confirmPollMs, confirmTimeoutMs]);

  const verify = React.useCallback(
    async (response: CheckoutResponse) => {
      setState({ kind: "verifying" });
      try {
        await portalApi.verifyPayment(response);
        setState({ kind: "success" });
      } catch (err) {
        if (err instanceof ApiError && err.code === "INVALID_STATE") {
          setState({ kind: "error", retry: "checkout", message: "The payment didn't go through. Please try again." });
          return;
        }
        await confirmViaPolling();
      }
    },
    [confirmViaPolling],
  );

  async function pay() {
    if (!order) return;
    setState({ kind: "checkout" });
    try {
      const Razorpay = await loadRazorpay(scriptTimeoutMs);
      openCheckout(Razorpay, order.checkout, {
        onSuccess: (response) => void verify(response),
        onFailure: (failure) =>
          setState({
            kind: "error",
            retry: "checkout",
            message: `Payment failed${failure.error.description ? `: ${failure.error.description}` : ""}. You can try again.`,
          }),
        onDismiss: () =>
          setState((s) => (s.kind === "checkout" ? { kind: "ready", notice: "Payment was cancelled. You can try again." } : s)),
      });
    } catch {
      setState({
        kind: "error",
        retry: "checkout",
        message: "We couldn't open the secure payment window. Check your connection or disable ad-blockers, then try again.",
      });
    }
  }

  if (state.kind === "success") {
    return (
      <PageShell eyebrow="Step 3 of 6" title="Payment successful">
        <div role="status" className="text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted dark:text-slate-400">
            Your registration fee is paid. We&apos;ve emailed your exam link — you can also start the exam right now.
          </p>
          <button
            type="button"
            onClick={() => void journey.reload().then(() => router.push("/exam"))}
            className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-6")}
          >
            Go to your exam
          </button>
        </div>
      </PageShell>
    );
  }

  const amount = order ? formatAmount(order.checkout.amount, order.checkout.currency) : null;
  const busy = state.kind === "loading" || state.kind === "checkout" || state.kind === "verifying" || state.kind === "confirming";

  return (
    <PageShell
      eyebrow="Step 3 of 6"
      title="Pay your registration fee"
      intro="Your exam link is unlocked as soon as the payment is confirmed."
    >
      <div className="flex items-center justify-between rounded-lg bg-light-blue/40 p-5 dark:bg-dark-surface-alt">
        <span className="text-sm font-semibold text-navy dark:text-white">Registration fee</span>
        <span className="text-2xl font-extrabold text-navy dark:text-white" aria-live="polite">
          {amount ?? <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading fee" />}
        </span>
      </div>

      {state.kind === "verifying" || state.kind === "confirming" ? (
        <p role="status" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-navy dark:text-white">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {state.kind === "verifying" ? "Verifying your payment..." : "We're confirming your payment. This can take up to a minute..."}
        </p>
      ) : null}

      {state.kind === "error" ? (
        <div className="mt-6">
          <FormMessage>{state.message}</FormMessage>
          {state.retry === "order" ? (
            <Button variant="outline" className="mt-3" onClick={() => void loadOrder()}>
              Try again
            </Button>
          ) : null}
          {state.retry === "none" ? (
            <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "mt-3")}>
              Back to dashboard
            </Link>
          ) : null}
        </div>
      ) : null}

      {state.kind === "ready" && state.notice ? (
        <p role="status" className="mt-6 text-sm font-semibold text-muted dark:text-slate-400">{state.notice}</p>
      ) : null}

      {state.kind !== "error" || state.retry === "checkout" ? (
        <Button size="lg" className="mt-6 w-full" onClick={() => void pay()} disabled={busy || !order}>
          <CreditCard className="h-4 w-4" aria-hidden="true" />
          {state.kind === "checkout" ? "Opening secure payment..." : amount ? `Pay ${amount}` : "Pay"}
        </Button>
      ) : null}

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted dark:text-slate-400">
        <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Secured by Razorpay
        <ShieldCheck className="ml-2 h-3.5 w-3.5" aria-hidden="true" /> We never see your card details
      </p>
    </PageShell>
  );
}
