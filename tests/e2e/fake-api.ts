import type { Page, Route } from "@playwright/test";

/**
 * Stateful in-browser fake of the Candidate Platform API for E2E runs (one candidate).
 * Responses carry CORS headers for the app origin, as the real API does.
 */
type Step =
  | "demo_pending"
  | "fee_pending"
  | "exam_ready"
  | "exam_in_progress"
  | "exam_completed"
  | "feedback_submitted"
  | "completed";

export interface FakeState {
  signedIn: boolean;
  step: Step;
  feedback: unknown;
  resultPublished: boolean;
  requests: string[];
}

const API = "http://api.test/api/v1";

export async function installFakeApi(page: Page, baseURL: string, initial: Partial<FakeState> = {}): Promise<FakeState> {
  const state: FakeState = { signedIn: false, step: "demo_pending", feedback: null, resultPublished: false, requests: [], ...initial };
  const origin = new URL(baseURL).origin;
  const cors = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "content-type,authorization,x-session-mode",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  };
  const candidate = () => ({
    id: "c1",
    fullName: "Asha Verma",
    email: "asha@example.com",
    phone: "+919876543210",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    college: "ABC Engineering College",
    place: "Kothrud",
    role: "candidate",
    onboardingStep: state.step,
    demoAction: null,
    createdAt: "2026-10-14T00:00:00Z",
  });
  const session = () => ({ accessToken: "e2e-token", accessTokenExpiresIn: 900, candidate: candidate() });
  const json = (route: Route, status: number, body: unknown) =>
    route.fulfill({ status, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const ok = (route: Route, data: unknown, status = 200) => json(route, status, { data, meta: { requestId: "e2e" } });
  const fail = (route: Route, status: number, code: string) =>
    json(route, status, { error: { code, message: code, details: [] }, meta: { requestId: "e2e" } });
  const exam = { attemptId: "att-1", status: "link_issued", examUrl: "https://exam.test/start?attempt=att-1", completedAt: null };

  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    const path = new URL(req.url()).pathname.replace("/api/v1", "");
    const key = `${req.method()} ${path}`;
    state.requests.push(key);
    const authed = req.headers()["authorization"] === "Bearer e2e-token";

    switch (key) {
      case "POST /auth/register":
        state.signedIn = true;
        state.step = "demo_pending";
        return ok(route, { ...session(), nextStep: "demo_pending" }, 201);
      case "POST /auth/login":
        state.signedIn = true;
        return ok(route, session());
      case "POST /auth/refresh":
        return state.signedIn ? ok(route, session()) : fail(route, 401, "UNAUTHENTICATED");
      case "POST /auth/logout":
        state.signedIn = false;
        return route.fulfill({ status: 204, headers: cors });
    }
    if (!authed || !state.signedIn) return fail(route, 401, "UNAUTHENTICATED");

    switch (key) {
      case "GET /onboarding/status":
        return ok(route, { step: state.step, demoAction: null, nextStep: null });
      case "POST /onboarding/demo/skip":
      case "POST /onboarding/demo/complete":
        state.step = "fee_pending";
        return ok(route, { step: state.step, demoAction: "skipped", nextStep: "exam_ready" });
      case "POST /payments/orders":
        if (state.step !== "fee_pending") return fail(route, 422, "INVALID_STATE");
        return ok(
          route,
          {
            payment: { id: "p1", status: "pending", amountMinor: 49900, currency: "INR", providerOrderId: "order_e2e", verifiedAt: null, createdAt: null },
            checkout: {
              keyId: "rzp_test_e2e",
              orderId: "order_e2e",
              amount: 49900,
              currency: "INR",
              name: "HVK Tech innovation",
              prefill: { name: "Asha Verma", email: "asha@example.com", contact: "+919876543210" },
            },
          },
          201,
        );
      case "POST /payments/verify":
        state.step = "exam_ready";
        return ok(route, { payment: { id: "p1", status: "paid" }, exam });
      case "GET /exams/current":
        return ok(route, { ...exam, status: state.step === "exam_completed" ? "completed" : "link_issued" });
      case "POST /exams/attempts/att-1/complete":
        // The real completion arrives from the exam provider; simulate it immediately.
        state.step = "exam_completed";
        return ok(route, { status: "completed" }, 202);
      case "POST /exams/attempts/att-1/feedback":
        state.feedback = req.postDataJSON();
        state.step = "feedback_submitted";
        return ok(route, { id: "fb-1" }, 201);
      case "GET /results/me":
        return ok(
          route,
          state.resultPublished
            ? { attemptId: "att-1", status: "published", score: 88, outcome: "pass", publishedAt: "2026-10-15T00:00:00Z" }
            : { attemptId: "att-1", status: "pending", score: null, outcome: null, publishedAt: null },
        );
      default:
        return fail(route, 404, "NOT_FOUND");
    }
  });

  // Razorpay Checkout stub: "pays" immediately when opened.
  await page.route("https://checkout.razorpay.com/v1/checkout.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.Razorpay = function (opts) {
        this.on = function () {};
        this.open = function () {
          window.__rzpOptions = opts;
          setTimeout(function () {
            opts.handler({ razorpay_order_id: opts.order_id, razorpay_payment_id: "pay_e2e", razorpay_signature: "${"a".repeat(64)}" });
          }, 50);
        };
      };`,
    }),
  );

  return state;
}
