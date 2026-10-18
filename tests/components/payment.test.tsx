import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateOrderResult, Payment } from "@/types/api";
import type { RazorpayFailure } from "@/lib/razorpay";
import { API, fail, ok } from "../msw/handlers";
import { server } from "../msw/server";
import { nav, renderPortal } from "../helpers/portal";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { Payment: PaymentPage } = await import("@/components/portal/payment");

const ORDER: CreateOrderResult = {
  payment: { id: "p1", status: "pending", amountMinor: 49900, currency: "INR", providerOrderId: "order_1", verifiedAt: null, createdAt: null },
  checkout: {
    keyId: "rzp_test_key",
    orderId: "order_1",
    amount: 49900,
    currency: "INR",
    name: "HVK Infotech",
    prefill: { name: "Asha Verma", email: "asha@example.com", contact: "+919876543210" },
  },
};
const SUCCESS = { razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: "a".repeat(64) };
const paid = (status: Payment["status"]): Payment[] => [{ ...ORDER.payment, status }];

/** Fake Razorpay Checkout capturing options and letting tests trigger outcomes. */
class FakeRazorpay {
  static last: FakeRazorpay | null = null;
  failed: ((f: RazorpayFailure) => void) | null = null;
  opened = false;
  constructor(readonly options: Record<string, unknown> & { handler: (r: unknown) => void; modal: { ondismiss: () => void } }) {
    FakeRazorpay.last = this;
  }
  open() {
    this.opened = true;
  }
  on(_event: string, cb: (f: RazorpayFailure) => void) {
    this.failed = cb;
  }
}

function withOrder() {
  server.use(http.post(`${API}/payments/orders`, () => ok(ORDER, 201)));
}

beforeEach(() => {
  nav.reset();
  FakeRazorpay.last = null;
  window.Razorpay = FakeRazorpay as unknown as Window["Razorpay"];
});
afterEach(() => {
  delete window.Razorpay;
  document.querySelectorAll('script[src*="checkout.razorpay.com"]').forEach((el) => el.remove());
});

describe("Payment (US5)", () => {
  it("shows the fee from the API and opens Checkout with the server order", async () => {
    withOrder();
    const user = userEvent.setup();
    renderPortal(<PaymentPage />, { pathname: "/payment", step: "fee_pending" });
    const pay = await screen.findByRole("button", { name: "Pay ₹499.00" });
    await user.click(pay);
    expect(FakeRazorpay.last?.opened).toBe(true);
    expect(FakeRazorpay.last?.options).toMatchObject({
      key: "rzp_test_key",
      order_id: "order_1",
      amount: 49900,
      currency: "INR",
      prefill: { name: "Asha Verma", email: "asha@example.com", contact: "+919876543210" },
    });
  });

  it("verifies the payment with the API, then sends the candidate to the exam", async () => {
    withOrder();
    let verified: unknown;
    server.use(
      http.post(`${API}/payments/verify`, async ({ request }) => {
        verified = await request.json();
        return ok({ payment: { ...ORDER.payment, status: "paid" }, exam: { attemptId: "a1", status: "link_issued", examUrl: "https://exam.test/a1", completedAt: null } });
      }),
    );
    const user = userEvent.setup();
    const { statusCalls } = renderPortal(<PaymentPage />, { pathname: "/payment", step: "fee_pending" });
    await user.click(await screen.findByRole("button", { name: /Pay/ }));
    act(() => FakeRazorpay.last!.options.handler(SUCCESS));

    expect(await screen.findByRole("heading", { name: "Payment successful" })).toBeInTheDocument();
    expect(verified).toEqual(SUCCESS);

    statusCalls.step = "exam_ready";
    await user.click(screen.getByRole("button", { name: "Go to your exam" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/exam"));
  });

  it("regression: simultaneous mounts share one order request", async () => {
    let calls = 0;
    server.use(
      http.post(`${API}/payments/orders`, async () => {
        calls += 1;
        await new Promise((r) => setTimeout(r, 30));
        return ok(ORDER, 201);
      }),
    );
    renderPortal(
      <>
        <PaymentPage />
        <PaymentPage />
      </>,
      { pathname: "/payment", step: "fee_pending" },
    );
    expect(await screen.findAllByRole("button", { name: "Pay ₹499.00" })).toHaveLength(2);
    expect(calls).toBe(1);
  });

  it("closing Checkout keeps the candidate on the page with a notice", async () => {
    withOrder();
    const user = userEvent.setup();
    renderPortal(<PaymentPage />, { pathname: "/payment", step: "fee_pending" });
    await user.click(await screen.findByRole("button", { name: /Pay/ }));
    act(() => FakeRazorpay.last!.options.modal.ondismiss());
    expect(await screen.findByText("Payment was cancelled. You can try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pay/ })).toBeEnabled();
  });

  it("a failed payment shows the reason and allows retrying", async () => {
    withOrder();
    const user = userEvent.setup();
    renderPortal(<PaymentPage />, { pathname: "/payment", step: "fee_pending" });
    await user.click(await screen.findByRole("button", { name: /Pay/ }));
    act(() => FakeRazorpay.last!.failed!({ error: { description: "Card declined" } }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Payment failed: Card declined");
    await user.click(screen.getByRole("button", { name: /Pay/ }));
    expect(FakeRazorpay.last?.opened).toBe(true);
  });

  it("a verification 401 does not sign the candidate out, and the webhook can still confirm", async () => {
    withOrder();
    let polls = 0;
    server.use(
      http.post(`${API}/payments/verify`, () => fail(401, "INVALID_SIGNATURE")),
      http.get(`${API}/payments/me`, () => {
        polls += 1;
        return ok(paid(polls >= 2 ? "paid" : "pending"));
      }),
    );
    const user = userEvent.setup();
    renderPortal(<PaymentPage confirmPollMs={30} confirmTimeoutMs={2_000} />, { pathname: "/payment", step: "fee_pending" });
    await user.click(await screen.findByRole("button", { name: /Pay/ }));
    await waitFor(() => expect(FakeRazorpay.last?.options).toBeDefined());
    act(() => FakeRazorpay.last!.options.handler(SUCCESS));
    expect(await screen.findByText(/We're confirming your payment/)).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Payment successful" })).toBeInTheDocument();
    expect(polls).toBe(2);
    // Still signed in: the hint cookie was not cleared by the 401.
    expect(document.cookie).toContain("hvk_signed_in=1");
  });

  it("gives support guidance if the payment is never confirmed", async () => {
    withOrder();
    server.use(
      http.post(`${API}/payments/verify`, () => Response.error()),
      http.get(`${API}/payments/me`, () => ok(paid("pending"))),
    );
    const user = userEvent.setup();
    renderPortal(<PaymentPage confirmPollMs={20} confirmTimeoutMs={150} />, { pathname: "/payment", step: "fee_pending" });
    await user.click(await screen.findByRole("button", { name: /Pay/ }));
    act(() => FakeRazorpay.last!.options.handler(SUCCESS));
    expect(await screen.findByRole("alert", {}, { timeout: 3_000 })).toHaveTextContent("contact support");
    expect(screen.getByRole("link", { name: "Back to dashboard" })).toBeInTheDocument();
  });

  it("explains when the payment window cannot load (blocked script)", async () => {
    delete window.Razorpay;
    withOrder();
    const user = userEvent.setup();
    renderPortal(<PaymentPage scriptTimeoutMs={100} />, { pathname: "/payment", step: "fee_pending" });
    await user.click(await screen.findByRole("button", { name: /Pay/ }));
    expect(document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')).not.toBeNull();
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn't open the secure payment window");
  });

  it("if the API says the fee is no longer payable, re-reads the journey", async () => {
    server.use(http.post(`${API}/payments/orders`, () => fail(422, "INVALID_STATE")));
    const { statusCalls } = renderPortal(<PaymentPage />, { pathname: "/payment", step: "fee_pending" });
    await waitFor(() => expect(statusCalls.count).toBeGreaterThanOrEqual(2));
  });

  it("shows a retry when the order cannot be created", async () => {
    let calls = 0;
    server.use(
      http.post(`${API}/payments/orders`, () => {
        calls += 1;
        return calls === 1 ? fail(500, "INTERNAL_ERROR") : ok(ORDER, 201);
      }),
    );
    const user = userEvent.setup();
    renderPortal(<PaymentPage />, { pathname: "/payment", step: "fee_pending" });
    await user.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("button", { name: "Pay ₹499.00" })).toBeEnabled();
  });
});
