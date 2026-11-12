import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LearningCourse, SkillAttempt, SkillExam, SkillExamAdminDetail, SkillExamResult, SkillExamTargets } from "@/types/api";
import { API, fail, ok } from "../msw/handlers";
import { server } from "../msw/server";
import { nav, renderPortal } from "../helpers/portal";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { SkillExamRunner, formatClock } = await import("@/components/portal/skill-exam-runner");
const { SkillExams } = await import("@/components/admin/skill-exams");
const { Learning } = await import("@/components/learning/learning");

const attempt = (over: Partial<SkillAttempt> = {}): SkillAttempt => ({
  id: "att1",
  examId: "ex1",
  title: "HTML exam",
  attemptNo: 1,
  status: "in_progress",
  startedAt: new Date().toISOString(),
  deadlineAt: new Date(Date.now() + 20 * 60_000).toISOString(),
  answers: {},
  questions: [
    { id: "q1", prompt: "What does HTML stand for?", marks: 1, options: [{ id: "q1-a", label: "HyperText Markup Language" }, { id: "q1-b", label: "High Tech Modern Language" }] },
    { id: "q2", prompt: "Which tag makes a link?", marks: 1, options: [{ id: "q2-a", label: "<a>" }, { id: "q2-b", label: "<p>" }] },
  ],
  ...over,
});

const result = (over: Partial<SkillExamResult> = {}): SkillExamResult => ({
  attemptId: "att1",
  examId: "ex1",
  attemptNo: 1,
  score: 1,
  totalMarks: 2,
  percentage: 50,
  passed: true,
  passPercentage: 40,
  correctCount: 1,
  questionCount: 2,
  completedAt: new Date().toISOString(),
  ...over,
});

beforeEach(() => {
  nav.reset();
});

describe("formatClock", () => {
  it("shows minutes and seconds, and hours when needed", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(125)).toBe("2:05");
    expect(formatClock(3725)).toBe("1:02:05");
    expect(formatClock(-5)).toBe("0:00");
  });
});

describe("Taking a course or domain exam", () => {
  it("answers, submits and shows the result at once, then lets the candidate retake", async () => {
    const saved: unknown[] = [];
    let starts = 0;
    server.use(
      http.post(`${API}/skill-exams/ex1/start`, () => {
        starts += 1;
        return ok(attempt({ attemptNo: starts }), 201);
      }),
      http.put(`${API}/skill-exam-attempts/att1/answers/:qid`, async ({ params, request }) => {
        saved.push([params.qid, ((await request.json()) as { selectedOptionId: string }).selectedOptionId]);
        return ok({ questionId: String(params.qid), selectedOptionId: "x" });
      }),
      http.post(`${API}/skill-exam-attempts/att1/submit`, () => ok(result())),
    );
    const user = userEvent.setup();
    render(<SkillExamRunner examId="ex1" />);

    expect(await screen.findByText("What does HTML stand for?")).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 2/)).toBeInTheDocument();
    await user.click(screen.getByLabelText("HyperText Markup Language"));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(await screen.findByLabelText("<a>"));
    expect(saved).toEqual([["q1", "q1-a"], ["q2", "q2-a"]]);

    await user.click(screen.getByRole("button", { name: "Submit exam" }));
    expect(await screen.findByText("You passed!")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 correct/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Retake exam/ }));
    expect(await screen.findByText("Attempt 2")).toBeInTheDocument();
    expect(starts).toBe(2);
  });

  it("asks before submitting with unanswered questions", async () => {
    let submitted = 0;
    server.use(
      http.post(`${API}/skill-exams/ex1/start`, () => ok(attempt(), 201)),
      http.post(`${API}/skill-exam-attempts/att1/submit`, () => {
        submitted += 1;
        return ok(result({ percentage: 0, passed: false, correctCount: 0, score: 0 }));
      }),
    );
    const user = userEvent.setup();
    render(<SkillExamRunner examId="ex1" />);
    await screen.findByText("What does HTML stand for?");
    await user.click(screen.getByRole("button", { name: "Go to question 2" }));
    await user.click(screen.getByRole("button", { name: "Submit exam" }));
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Submit with 2 unanswered?");
    await user.click(screen.getByRole("button", { name: "Keep answering" }));
    expect(submitted).toBe(0);
    await user.click(screen.getByRole("button", { name: "Submit exam" }));
    await user.click(screen.getByRole("button", { name: "Submit now" }));
    expect(await screen.findByText("Not passed this time")).toBeInTheDocument();
    expect(submitted).toBe(1);
  });

  it("resumes an open attempt with the answers already given", async () => {
    server.use(http.post(`${API}/skill-exams/ex1/start`, () => ok(attempt({ answers: { q1: "q1-b" } }), 201)));
    render(<SkillExamRunner examId="ex1" />);
    expect(await screen.findByLabelText("High Tech Modern Language")).toBeChecked();
    expect(screen.getByText(/1 answered/)).toBeInTheDocument();
  });

  it("explains a locked exam when the payment is not approved yet", async () => {
    server.use(http.post(`${API}/skill-exams/ex1/start`, () => fail(409, "PAYMENT_REQUIRED")));
    render(<SkillExamRunner examId="ex1" />);
    expect(await screen.findByText("The exams unlock after you pay the registration fee.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to payment" })).toHaveAttribute("href", "/payment");
    expect(screen.getByRole("link", { name: "Back to my learning" })).toHaveAttribute("href", "/learning");
  });
});

const exam = (over: Partial<SkillExam> = {}): SkillExam => ({
  id: "ex1",
  scope: "course",
  courseId: "html",
  domain: "",
  targetTitle: "HTML",
  title: "HTML exam",
  description: "",
  durationMinutes: 30,
  passPercentage: 40,
  questionCount: 10,
  unlocked: true,
  attempts: 0,
  bestPercentage: null,
  passed: false,
  openAttemptId: null,
  ...over,
});

const lesson = (id: string) => ({ id, title: `Lesson ${id}`, sectionTitle: "Basics", sectionPosition: 1, position: 1, durationSeconds: 100, completed: false, positionSeconds: 0, preview: true });
const course = (id: string, title: string): LearningCourse => ({ id, title, slug: id, description: "", position: 1, lessonCount: 1, completedCount: 0, durationSeconds: 100, comingSoon: false, lessons: [lesson(`${id}-l`)] });

describe("Exams on the learning page", () => {
  function serve(exams: SkillExam[], tracks: unknown[] = []) {
    server.use(
      http.get(`${API}/tracks`, () => ok(tracks)),
      http.get(`${API}/courses`, () => ok([course("html", "HTML"), course("js", "JavaScript")])),
      http.get(`${API}/skill-exams`, () => ok(exams)),
    );
  }

  it("puts an exam button on each course that has one, with the best result", async () => {
    serve([exam(), exam({ id: "ex2", courseId: "js", targetTitle: "JavaScript", attempts: 2, bestPercentage: 85, passed: true })]);
    renderPortal(<Learning hub />, { pathname: "/learning", step: "exam_ready" });
    expect(await screen.findByRole("link", { name: "Take exam for HTML" })).toHaveAttribute("href", "/skill-exam/ex1");
    expect(screen.getByRole("link", { name: "Retake exam for JavaScript" })).toHaveAttribute("href", "/skill-exam/ex2");
    expect(screen.getByText("Passed · best 85%")).toBeInTheDocument();
  });

  it("keeps the exam buttons locked until the payment: a button instead of a link (it opens the payment popup)", async () => {
    serve([exam({ unlocked: false })]);
    renderPortal(<Learning hub />, { pathname: "/learning", step: "fee_pending" });
    expect(await screen.findByRole("button", { name: "Unlock the exam for HTML" })).toBeEnabled();
    expect(screen.queryByRole("link", { name: /Take exam/ })).not.toBeInTheDocument();
  });

  it("offers the domain exam of the chosen pathway, to skip its courses", async () => {
    const track = { id: "t1", title: "MERN Stack", slug: "mern", description: "", position: 1, domain: "Full Stack Development", domainPosition: 1, available: true, selected: true, courseCount: 2, lessonCount: 2, completedCount: 0, durationSeconds: 200, courses: [] };
    serve([exam(), exam({ id: "dx", scope: "domain", courseId: null, domain: "Full Stack Development", targetTitle: "Full Stack Development", questionCount: 40, durationMinutes: 60 })], [track]);
    renderPortal(<Learning hub />, { pathname: "/learning", step: "exam_ready" });
    const card = await screen.findByRole("region", { name: "Full Stack Development domain exam" });
    expect(within(card).getByText(/Skip the courses and take the domain exam directly/)).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "Take exam for Full Stack Development" })).toHaveAttribute("href", "/skill-exam/dx");
  });
});

const targets = (over: Partial<SkillExamTargets> = {}): SkillExamTargets => ({
  courses: [
    { id: "html", title: "HTML", status: "published", examId: null, examStatus: null },
    { id: "js", title: "JavaScript", status: "published", examId: "ex-js", examStatus: "draft" },
    { id: "css", title: "CSS", status: "published", examId: "ex-css", examStatus: "published" },
  ],
  domains: [{ name: "Full Stack Development", examId: null, examStatus: null }],
  ...over,
});

const detail = (over: Partial<SkillExamAdminDetail> = {}): SkillExamAdminDetail => ({
  id: "new1",
  scope: "course",
  courseId: "html",
  domain: "",
  targetTitle: "HTML",
  title: "HTML exam",
  description: "",
  durationMinutes: 30,
  passPercentage: 40,
  status: "draft",
  questionCount: 1,
  attemptCount: 0,
  publishedAt: null,
  questions: [{ id: "q1", prompt: "Q?", marks: 1, options: [{ id: "a", label: "A", isCorrect: true }, { id: "b", label: "B", isCorrect: false }] }],
  ...over,
});

describe("Staff: course and domain exams", () => {
  it("shows every domain and course with its exam state", async () => {
    server.use(http.get(`${API}/admin/skill-exams/targets`, () => ok(targets())));
    render(<SkillExams />);
    expect(await screen.findByRole("button", { name: "Create exam for HTML" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create exam for Full Stack Development" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit exam for JavaScript" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish exam for JavaScript" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archive exam for CSS" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit exam for CSS" })).not.toBeInTheDocument(); // published: archive and replace
  });

  it("creates a course exam from typed questions and publishes it", async () => {
    const calls: { created: unknown[]; published: string[] } = { created: [], published: [] };
    server.use(
      http.get(`${API}/admin/skill-exams/targets`, () => ok(targets())),
      http.post(`${API}/admin/skill-exams`, async ({ request }) => {
        calls.created.push(await request.json());
        return ok(detail(), 201);
      }),
      http.post(`${API}/admin/skill-exams/new1/publish`, () => {
        calls.published.push("new1");
        return ok(detail({ status: "published" }));
      }),
    );
    const user = userEvent.setup();
    render(<SkillExams />);
    await user.click(await screen.findByRole("button", { name: "Create exam for HTML" }));
    expect(screen.getByLabelText("Title")).toHaveValue("HTML exam");
    await user.type(screen.getByLabelText("Question text"), "What does HTML stand for?");
    await user.type(screen.getByLabelText("Question 1 option 1"), "HyperText Markup Language");
    await user.type(screen.getByLabelText("Question 1 option 2"), "Other");
    await user.click(screen.getByRole("button", { name: "Save and publish" }));

    await waitFor(() => expect(calls.published).toEqual(["new1"]));
    const body = calls.created[0] as { scope: string; courseId: string; durationMinutes: number; passPercentage: number; questions: { prompt: string; options: { isCorrect: boolean }[] }[] };
    expect(body).toMatchObject({ scope: "course", courseId: "html", durationMinutes: 30, passPercentage: 40 });
    expect(body.questions[0]!.prompt).toBe("What does HTML stand for?");
    expect(body.questions[0]!.options.map((o) => o.isCorrect)).toEqual([true, false]);
    expect(await screen.findByText("Published: HTML exam")).toBeInTheDocument();
  });

  it("creates a domain exam with the domain name", async () => {
    const created: unknown[] = [];
    server.use(
      http.get(`${API}/admin/skill-exams/targets`, () => ok(targets())),
      http.post(`${API}/admin/skill-exams`, async ({ request }) => {
        created.push(await request.json());
        return ok(detail({ scope: "domain", courseId: null, domain: "Full Stack Development", targetTitle: "Full Stack Development" }), 201);
      }),
    );
    const user = userEvent.setup();
    render(<SkillExams />);
    await user.click(await screen.findByRole("button", { name: "Create exam for Full Stack Development" }));
    await user.type(screen.getByLabelText("Question text"), "Q?");
    await user.type(screen.getByLabelText("Question 1 option 1"), "A");
    await user.type(screen.getByLabelText("Question 1 option 2"), "B");
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0]).toMatchObject({ scope: "domain", domain: "Full Stack Development", durationMinutes: 60 });
    expect(await screen.findByText("Draft saved: HTML exam")).toBeInTheDocument();
  });

  it("archives a published exam after confirming, and shows the server's message when something is wrong", async () => {
    const archived: string[] = [];
    server.use(
      http.get(`${API}/admin/skill-exams/targets`, () => ok(targets())),
      http.post(`${API}/admin/skill-exams/ex-css/archive`, () => {
        archived.push("ex-css");
        return ok(detail({ status: "archived" }));
      }),
      http.post(`${API}/admin/skill-exams/ex-js/publish`, () => fail(422, "INVALID_STATE")),
    );
    const user = userEvent.setup();
    render(<SkillExams />);
    await user.click(await screen.findByRole("button", { name: "Publish exam for JavaScript" }));
    expect(await screen.findByRole("alert")).not.toBeEmptyDOMElement(); // the API error is shown, not a success message
    expect(screen.queryByText(/^Published the exam/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Archive exam for CSS" }));
    expect(archived).toEqual([]); // asks first
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Archive" }));
    await waitFor(() => expect(archived).toEqual(["ex-css"]));
    expect(await screen.findByText(/Archived the exam for CSS/)).toBeInTheDocument();
  });
});
