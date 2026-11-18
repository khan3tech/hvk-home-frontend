import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillExamAttemptAdmin } from "@/types/api";
import { API, ok } from "../msw/handlers";
import { server } from "../msw/server";
import { nav, renderPortal } from "../helpers/portal";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { ExamResults } = await import("@/components/admin/exam-results");

const row = (over: Partial<SkillExamAttemptAdmin> = {}): SkillExamAttemptAdmin => ({
  id: "att1",
  candidate: { id: "c1", fullName: "Hari Kumar", email: "hari@example.com", phone: "+919812345678" },
  exam: { id: "ex1", title: "Full Stack Development exam" },
  state: "disqualified",
  percentage: 64,
  correctCount: 64,
  questionCount: 100,
  startedAt: "2026-11-19T05:00:00Z",
  completedAt: "2026-11-19T06:30:00Z",
  terminationReason: null,
  releasedAt: null,
  canAllowNewAttempt: true,
  feedback: { rating: 4, comments: "Tough but fair", at: "2026-11-19T06:35:00Z" },
  ...over,
});

beforeEach(() => nav.reset());

describe("Staff: exam results (QA item 11)", () => {
  it("shows scores, why an exam ended and feedback, filters, and allows a new attempt", async () => {
    const queries: string[] = [];
    let released = false;
    server.use(
      http.get(`${API}/admin/skill-exam-attempts`, ({ request }) => {
        queries.push(new URL(request.url).search);
        return ok({
          items: [row({ canAllowNewAttempt: !released, releasedAt: released ? "2026-11-19T07:00:00Z" : null }), row({ id: "att2", state: "terminated", terminationReason: "tab_hidden", canAllowNewAttempt: false, feedback: null })],
          page: 1,
          limit: 20,
          total: 2,
        });
      }),
      http.post(`${API}/admin/skill-exam-attempts/att1/allow-new-attempt`, () => {
        released = true;
        return ok({ id: "att1", releasedAt: "2026-11-19T07:00:00Z" });
      }),
    );
    const user = userEvent.setup();
    renderPortal(<ExamResults />, { pathname: "/admin/exam-results", step: "completed", role: "admin", area: "admin" });

    const first = (await screen.findAllByText("Hari Kumar"))[0]!.closest("tr")!;
    expect(first).toHaveTextContent("hari@example.com");
    expect(first).toHaveTextContent("Disqualified");
    expect(first).toHaveTextContent("64%");
    expect(first).toHaveTextContent("4/5");
    expect(screen.getByText("Switched tab or app")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Result"), "terminated");
    expect(queries.at(-1)).toContain("status=terminated");
    await user.type(screen.getByLabelText("Candidate"), "hari");
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(queries.at(-1)).toContain("q=hari");

    await user.click(within(first).getByRole("button", { name: "Allow new attempt" }));
    expect(await screen.findByText("Hari Kumar can now start one more exam.")).toBeInTheDocument();
    expect(await screen.findByText("New attempt allowed")).toBeInTheDocument();
  });
});
