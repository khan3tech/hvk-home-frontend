import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Exam as ExamDTO } from "@/types/api";
import { API, fail, makeCandidate, ok } from "../msw/handlers";
import { server } from "../msw/server";
import { nav, renderPortal } from "../helpers/portal";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { Exam } = await import("@/components/portal/exam");
const { Feedback } = await import("@/components/portal/feedback");
const { Result, ThankYou } = await import("@/components/portal/result");
const { Profile } = await import("@/components/portal/profile");

const EXAM: ExamDTO = { attemptId: "att-1", status: "link_issued", examUrl: "https://exam.test/start?attempt=att-1", completedAt: null };

beforeEach(() => nav.reset());

describe("Exam (US6)", () => {
  it("links to the exam in a new tab", async () => {
    server.use(http.get(`${API}/exams/current`, () => ok(EXAM)));
    renderPortal(<Exam />, { pathname: "/exam", step: "exam_ready" });
    const link = await screen.findByRole("link", { name: /Start exam/ });
    expect(link).toHaveAttribute("href", EXAM.examUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("“I've finished” records a claim, then waits until the provider confirms completion", async () => {
    let claimed = false;
    server.use(
      http.get(`${API}/exams/current`, () => ok(EXAM)),
      http.post(`${API}/exams/attempts/att-1/complete`, () => {
        claimed = true;
        return ok({ status: "link_issued" }, 202);
      }),
    );
    const user = userEvent.setup();
    const { statusCalls } = renderPortal(<Exam pollMs={30} />, { pathname: "/exam", step: "exam_ready" });
    await user.click(await screen.findByRole("button", { name: /finished the exam/ }));
    expect(await screen.findByText(/Waiting for the exam platform/)).toBeInTheDocument();
    expect(claimed).toBe(true);
    expect(nav.push).not.toHaveBeenCalled();

    statusCalls.step = "exam_completed"; // provider callback arrives
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/feedback"));
  });

  it("shows an error if the exam cannot be loaded", async () => {
    server.use(http.get(`${API}/exams/current`, () => fail(500, "INTERNAL_ERROR")));
    renderPortal(<Exam />, { pathname: "/exam", step: "exam_ready" });
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong on our side");
  });
});

describe("Feedback (US6)", () => {
  it("requires a rating", async () => {
    const user = userEvent.setup();
    renderPortal(<Feedback />, { pathname: "/feedback", step: "exam_completed" });
    await user.click(await screen.findByRole("button", { name: "Submit feedback" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Please choose a rating");
  });

  it("submits rating, answers and comments once, then shows thank-you", async () => {
    let body: unknown;
    server.use(
      http.get(`${API}/exams/current`, () => ok({ ...EXAM, status: "completed" })),
      http.post(`${API}/exams/attempts/att-1/feedback`, async ({ request }) => {
        body = await request.json();
        return ok({ id: "fb-1" }, 201);
      }),
    );
    const user = userEvent.setup();
    renderPortal(<Feedback />, { pathname: "/feedback", step: "exam_completed" });
    await user.click(await screen.findByRole("radio", { name: "4 stars" }));
    await user.type(screen.getByLabelText(/instructions/), "Very clear");
    await user.type(screen.getByLabelText(/Anything else/), "Smooth process");
    await user.click(screen.getByRole("button", { name: "Submit feedback" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/thank-you"));
    expect(body).toEqual({ rating: 4, answers: [{ questionId: "clarity", answer: "Very clear" }], comments: "Smooth process" });
  });

  it("already-submitted feedback goes straight to thank-you", async () => {
    server.use(
      http.get(`${API}/exams/current`, () => ok({ ...EXAM, status: "completed" })),
      http.post(`${API}/exams/attempts/att-1/feedback`, () => fail(409, "FEEDBACK_EXISTS")),
    );
    const user = userEvent.setup();
    renderPortal(<Feedback />, { pathname: "/feedback", step: "exam_completed" });
    await user.click(await screen.findByRole("radio", { name: "5 stars" }));
    await user.click(screen.getByRole("button", { name: "Submit feedback" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/thank-you"));
  });
});

describe("Thank-you and result (US7)", () => {
  it("thank-you explains the 24-hour result email", async () => {
    renderPortal(<ThankYou />, { pathname: "/thank-you", step: "feedback_submitted" });
    expect(await screen.findByText(/emailed to you within 24 hours/)).toBeInTheDocument();
  });

  it.each([
    ["no result yet", null],
    ["pending", { attemptId: "att-1", status: "pending", score: null, outcome: null, publishedAt: null }],
  ])("result: %s → pending message", async (_label, result) => {
    server.use(http.get(`${API}/results/me`, () => ok(result)));
    renderPortal(<Result />, { pathname: "/result", step: "feedback_submitted" });
    expect(await screen.findByText(/isn't published yet/)).toBeInTheDocument();
  });

  it("result: published → score and outcome", async () => {
    server.use(
      http.get(`${API}/results/me`, () => ok({ attemptId: "att-1", status: "published", score: 82, outcome: "pass", publishedAt: "2026-10-15T00:00:00Z" })),
    );
    renderPortal(<Result />, { pathname: "/result", step: "completed" });
    expect(await screen.findByText("82")).toBeInTheDocument();
    expect(screen.getByText("Passed")).toBeInTheDocument();
  });
});

describe("Profile (US7)", () => {
  it("saves allowlisted fields and shows confirmation", async () => {
    let body: unknown;
    server.use(
      http.patch(`${API}/candidates/me`, async ({ request }) => {
        body = await request.json();
        return ok(makeCandidate({ city: "Mumbai" }));
      }),
    );
    const user = userEvent.setup();
    renderPortal(<Profile />, { pathname: "/profile", step: "fee_pending" });
    const city = await screen.findByLabelText(/^City/);
    expect(screen.getByLabelText("Email")).toBeDisabled();
    await user.clear(city);
    await user.type(city, "Mumbai");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Your profile has been saved.")).toBeInTheDocument();
    expect(body).toMatchObject({ city: "Mumbai", fullName: "Asha Verma", pincode: "411001" });
    expect(Object.keys(body as object)).not.toContain("email");
  });

  it("maps API field errors", async () => {
    server.use(http.patch(`${API}/candidates/me`, () => fail(400, "VALIDATION_ERROR", [{ path: "body.pincode", message: "Bad PIN" }])));
    const user = userEvent.setup();
    renderPortal(<Profile />, { pathname: "/profile", step: "fee_pending" });
    const city = await screen.findByLabelText(/^City/);
    await user.type(city, "x");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Bad PIN")).toBeInTheDocument();
  });
});
