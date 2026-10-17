import { describe, expect, it, vi } from "vitest";
import { openCheckout, type RazorpayConstructor } from "@/lib/razorpay";

const order = {
  keyId: "rzp_test_123",
  orderId: "order_1",
  amount: 49900,
  currency: "INR",
  name: "HVK Infotech",
  prefill: { name: "A", email: "a@example.com", contact: "+919000000000" },
};

describe("openCheckout", () => {
  it("opens Checkout with UPI first: QR, Google Pay, PhonePe and Paytm", () => {
    let options: Record<string, unknown> = {};
    const open = vi.fn();
    const Razorpay = vi.fn(function (this: unknown, o: Record<string, unknown>) {
      options = o;
      return { open, on: vi.fn() };
    }) as unknown as RazorpayConstructor;

    openCheckout(Razorpay, order, { onSuccess: vi.fn(), onFailure: vi.fn(), onDismiss: vi.fn() });

    expect(open).toHaveBeenCalledOnce();
    expect(options).toMatchObject({ key: "rzp_test_123", order_id: "order_1", amount: 49900 });
    const display = (options.config as { display: Record<string, unknown> }).display;
    expect(display.sequence).toEqual(["block.upi"]);
    expect(display.preferences).toEqual({ show_default_blocks: true }); // cards, net banking still offered
    expect(display.blocks).toMatchObject({
      upi: {
        instruments: [
          { method: "upi", flows: ["qr", "intent", "collect"], apps: ["google_pay", "phonepe", "paytm"] },
        ],
      },
    });
  });
});
