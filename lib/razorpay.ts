import type { CheckoutOptions } from "@/types/api";
import type { CheckoutResponse } from "@/lib/api/portal";

/** Minimal typing of Razorpay Checkout (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/). */
export interface RazorpayFailure {
  error: { code?: string; description?: string; reason?: string };
}

interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", cb: (response: RazorpayFailure) => void): void;
}

export interface RazorpayConstructor {
  new (options: Record<string, unknown>): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
let loading: Promise<RazorpayConstructor> | null = null;

/** Loads checkout.js once (only on the payment page). Rejects if blocked or offline. */
export function loadRazorpay(timeoutMs = 15_000): Promise<RazorpayConstructor> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  loading ??= new Promise<RazorpayConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    const timer = setTimeout(() => reject(new Error("Razorpay load timed out")), timeoutMs);
    script.onload = () => {
      clearTimeout(timer);
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new Error("Razorpay unavailable"));
    };
    script.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Razorpay script failed to load"));
    };
    document.body.appendChild(script);
  }).catch((err: unknown) => {
    loading = null; // allow a retry
    throw err;
  });
  return loading;
}

export interface CheckoutHandlers {
  onSuccess(response: CheckoutResponse): void;
  onFailure(failure: RazorpayFailure): void;
  onDismiss(): void;
}

/**
 * UPI first: QR code to scan (desktop), the installed UPI app on phones (Google Pay, PhonePe, Paytm…)
 * and UPI ID. Cards, net banking and wallets stay available below it.
 * https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/configure-payment-methods/
 */
export const UPI_FIRST_DISPLAY = {
  display: {
    blocks: {
      upi: {
        name: "Pay with UPI (Google Pay, PhonePe, Paytm or QR)",
        instruments: [{ method: "upi", flows: ["qr", "intent", "collect"], apps: ["google_pay", "phonepe", "paytm"] }],
      },
    },
    sequence: ["block.upi"],
    preferences: { show_default_blocks: true },
  },
} as const;

/** Opens Checkout for a server-created order. The key id is publishable; the secret never leaves the API. */
export function openCheckout(Razorpay: RazorpayConstructor, order: CheckoutOptions, handlers: CheckoutHandlers): void {
  const rzp = new Razorpay({
    config: UPI_FIRST_DISPLAY,
    key: order.keyId,
    order_id: order.orderId,
    amount: order.amount,
    currency: order.currency,
    name: order.name,
    description: "Registration fee",
    prefill: order.prefill,
    theme: { color: "#1d6fe0" },
    handler: (response: CheckoutResponse) => handlers.onSuccess(response),
    modal: { ondismiss: () => handlers.onDismiss() },
  });
  rzp.on("payment.failed", (failure) => handlers.onFailure(failure));
  rzp.open();
}

export function formatAmount(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amountMinor / 100);
}
