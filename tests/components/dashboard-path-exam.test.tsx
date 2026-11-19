import { screen, within } from "@testing-library/react";
import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MySkillAttempt } from "@/types/api";
import { API, ok } from "../msw/handlers";
import { server } from "../msw/server";
import { nav, renderPortal } from "../helpers/portal";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { Dashboard } = await import("@/components/portal/dashboard");

const taken = (over: Partial<MySkillAttempt> = {}): MySkillAttempt => ({
  attemptId: "a1",
  examId: "p-mern",
  title: "MERN Stack exam",
  targetTitle: "MERN Stack",
  state: "disqualified",
  startedAt: "2026-11-19T05:00:00Z",
  completedAt: "2026-11-19T06:30:00Z",
  feedbackGiven: false,
  ...over,
});

const stageState = (label: string) => {
  const item = within(screen.getByRole("list", { name: "Your progress" }))
    .getAllByRole("listitem")
    .find((li) => li.textContent?.includes(label))!;
  return item.textContent?.includes("(completed)") ? "done" : item.getAttribute("aria-current") === "step" ? "current" : "upcoming";
};

beforeEach(() => nav.reset());

describe("Dashboard follows the learning-path exam (Exam → Feedback → Result)", () => {
  it("after the exam, Exam is done and Feedback is next", async () => {
    server.use(http.get(`${API}/skill-exam-attempts`, () => ok([taken()])));
    renderPortal(<Dashboard />, { pathname: "/dashboard", step: "exam_ready" });
    const next = await screen.findByRole("link", { name: /Give feedback/ });
    expect(next).toHaveAttribute("href", "/skill-exam/p-mern");
    expect(screen.getByText("MERN Stack exam completed. Tell us how it went.")).toBeInTheDocument();
    expect(stageState("Exam")).toBe("done");
    expect(stageState("Feedback")).toBe("current");
    expect(stageState("Result")).toBe("upcoming");
  });

  it("after feedback, every step is done and the result is one click away (Disqualified wording)", async () => {
    server.use(http.get(`${API}/skill-exam-attempts`, () => ok([taken({ feedbackGiven: true })])));
    renderPortal(<Dashboard />, { pathname: "/dashboard", step: "exam_ready" });
    expect(await screen.findByRole("link", { name: /View result/ })).toHaveAttribute("href", "/skill-exam/p-mern");
    expect(screen.getByText("Don't worry. Contact our support team for further process.")).toBeInTheDocument();
    for (const label of ["Exam", "Feedback", "Result"]) expect(stageState(label)).toBe("done");
  });

  it("uses the Qualified wording for a qualified candidate", async () => {
    server.use(http.get(`${API}/skill-exam-attempts`, () => ok([taken({ state: "qualified", feedbackGiven: true })])));
    renderPortal(<Dashboard />, { pathname: "/dashboard", step: "exam_ready" });
    expect(await screen.findByText(/Congratulations! You have qualified. Please visit our branch/)).toBeInTheDocument();
  });

  it("keeps the usual Go to exam step before any exam is taken", async () => {
    server.use(http.get(`${API}/skill-exam-attempts`, () => ok([])));
    renderPortal(<Dashboard />, { pathname: "/dashboard", step: "exam_ready" });
    expect(await screen.findByRole("link", { name: /Go to exam/ })).toHaveAttribute("href", "/exam");
    expect(stageState("Exam")).toBe("current");
  });
});
