import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { LearningCourse, LearningLesson, SkillExam } from "@/types/api";
import { API, ok } from "../msw/handlers";
import { server } from "../msw/server";
import { nav, renderPortal } from "../helpers/portal";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { Learning } = await import("@/components/learning/learning");
const { PaymentSwitch } = await import("@/components/portal/manual-payment");

beforeAll(() => {
  // jsdom has no <dialog> modal support.
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

beforeEach(() => {
  nav.reset();
  window.history.replaceState(null, "", "/learning");
});

const lesson = (id: string, over: Partial<LearningLesson> = {}): LearningLesson => ({ id, title: `Lesson ${id}`, sectionTitle: "Basics", sectionPosition: 1, position: 1, durationSeconds: 100, completed: false, positionSeconds: 0, preview: false, ...over });
const course = (id: string, title: string, lessons: LearningLesson[]): LearningCourse => ({ id, title, slug: id, description: "", position: 1, lessonCount: lessons.length, completedCount: 0, durationSeconds: lessons.length * 100, comingSoon: false, lessons });
const courses = () => [course("js", "JavaScript", [lesson("a", { preview: true }), lesson("b")]), course("html", "HTML", [lesson("c", { preview: true })])];

const FEE = { mode: "manual", feeMinor: 299900, currency: "INR", instructions: "Pay at the office." } as const;

function serve(opts: { exams?: SkillExam[]; progress?: unknown[] } = {}) {
  server.use(
    http.get(`${API}/payments/config`, () => ok(FEE)),
    http.get(`${API}/tracks`, () => ok([])),
    http.get(`${API}/courses`, () => ok(courses())),
    http.get(`${API}/skill-exams`, () => ok(opts.exams ?? [])),
    http.post(`${API}/lessons/:id/play`, ({ params }) => ok({ url: `https://cdn.test/${String(params.id)}.mp4`, expiresAt: "2030-01-01T00:00:00Z" })),
    http.put(`${API}/lessons/:id/progress`, async ({ params, request }) => {
      const body = (await request.json()) as { positionSeconds: number; completed?: boolean };
      opts.progress?.push({ id: params.id, ...body });
      return ok({ lessonId: params.id, positionSeconds: body.positionSeconds, completed: body.completed ?? false });
    }),
  );
}

const exam = (over: Partial<SkillExam> = {}): SkillExam => ({
  id: "ex1",
  scope: "course",
  courseId: "js",
  domain: "",
  targetTitle: "JavaScript",
  title: "JavaScript exam",
  description: "",
  durationMinutes: 30,
  passPercentage: 40,
  questionCount: 10,
  unlocked: false,
  attempts: 0,
  bestPercentage: null,
  passed: false,
  openAttemptId: null,
  ...over,
});

const popup = () => screen.findByRole("dialog", { name: "Unlock all videos and exams" });

describe("after registration: courses first, no payment page", () => {
  it("sends a new candidate to the courses instead of the payment instructions (manual mode)", async () => {
    server.use(http.get(`${API}/payments/config`, () => ok(FEE)));
    renderPortal(<PaymentSwitch online={<p>videos</p>} />, { pathname: "/onboarding", step: "registered" });
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/learning"));
    expect(screen.queryByText(/Waiting for payment approval/)).not.toBeInTheDocument();
    expect(screen.queryByText(/₹/)).not.toBeInTheDocument(); // no amount yet
  });

  it("keeps the payment page reachable for the Pay button", async () => {
    server.use(http.get(`${API}/payments/config`, () => ok(FEE)));
    renderPortal(<PaymentSwitch online={<p>videos</p>} />, { pathname: "/payment", step: "demo_pending" });
    expect(await screen.findByRole("heading", { name: "Waiting for payment approval" })).toBeInTheDocument();
    expect(nav.replace).not.toHaveBeenCalled();
  });
});

describe("the payment popup (manual mode, before the payment is approved)", () => {
  it("opens when a locked video is chosen, shows the fee and a Pay button to the payment page", async () => {
    serve();
    const user = userEvent.setup();
    renderPortal(<Learning hub />, { pathname: "/learning", step: "demo_pending" });
    await user.click(await screen.findByRole("button", { name: "Watch free preview of JavaScript" }));
    const sidebar = await screen.findByRole("navigation", { name: "Course content" });
    expect(within(sidebar).getByRole("button", { name: /Lesson b \(locked until payment\)/ })).toBeEnabled();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); // the free video itself shows no popup
    await user.click(within(sidebar).getByRole("button", { name: /Lesson b/ }));
    const dialog = await popup();
    expect(within(dialog).getByTestId("prompt-fee")).toHaveTextContent(/^₹2,999$/);
    expect(within(dialog).getByRole("link", { name: /Pay ₹2,999/ })).toHaveAttribute("href", "/payment");
    expect(within(dialog).getByText(/how to pay/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lesson a" })).toBeInTheDocument(); // the locked video did not open
  });

  it("opens when Next would go to a locked video", async () => {
    serve();
    const user = userEvent.setup();
    renderPortal(<Learning hub />, { pathname: "/learning", step: "demo_pending" });
    await user.click(await screen.findByRole("button", { name: "Watch free preview of JavaScript" }));
    await user.click(await screen.findByRole("button", { name: /Skip lesson|Next lesson/ }));
    expect(await popup()).toBeInTheDocument();
  });

  it("opens when the free video is finished", async () => {
    const progress: unknown[] = [];
    serve({ progress });
    const user = userEvent.setup();
    const { container } = renderPortal(<Learning hub />, { pathname: "/learning", step: "demo_pending" });
    await user.click(await screen.findByRole("button", { name: "Watch free preview of JavaScript" }));
    await waitFor(() => expect(container.querySelector("video")).not.toBeNull());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.ended(container.querySelector("video")!);
    expect(await popup()).toBeInTheDocument();
    expect(progress).toContainEqual(expect.objectContaining({ id: "a", completed: true }));
  });

  it("opens when the candidate tries to go to the exam, and again after it was closed", async () => {
    serve();
    const user = userEvent.setup();
    renderPortal(<Learning hub />, { pathname: "/learning", step: "demo_pending" });
    await user.click(await screen.findByRole("button", { name: /Go to exam/ }));
    const dialog = await popup();
    await user.click(within(dialog).getByRole("button", { name: "Not now" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Go to exam/ }));
    expect(await popup()).toBeInTheDocument();
  });

  it("opens from a course or domain exam button", async () => {
    serve({ exams: [exam()] });
    const user = userEvent.setup();
    renderPortal(<Learning hub />, { pathname: "/learning", step: "demo_pending" });
    await user.click(await screen.findByRole("button", { name: "Unlock the exam for JavaScript" }));
    expect(await popup()).toBeInTheDocument();
  });

  it("shows nothing once the payment is approved: every video opens and the exam is a link", async () => {
    serve({ exams: [exam({ unlocked: true })] });
    const user = userEvent.setup();
    renderPortal(<Learning hub />, { pathname: "/learning", step: "exam_ready" });
    expect(await screen.findByRole("link", { name: /Go to exam/ })).toHaveAttribute("href", "/exam");
    expect(await screen.findByRole("link", { name: "Take exam for JavaScript" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start JavaScript" }));
    const sidebar = await screen.findByRole("navigation", { name: "Course content" });
    await user.click(within(sidebar).getByRole("button", { name: /Lesson b/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lesson b" })).toBeInTheDocument();
  });
});
