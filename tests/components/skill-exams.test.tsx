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
const { Exam } = await import("@/components/portal/exam");
const { ManagedExamList } = await import("@/components/portal/managed-exam-list");

/** Fake media: a track is an EventTarget that can fire "ended" like a real one. */
class FakeTrack extends EventTarget {
  stopped = false;
  stop() {
    this.stopped = true;
  }
  getSettings() {
    return { displaySurface: "monitor" };
  }
}
const fakeStream = () => {
  const track = new FakeTrack();
  return { track, stream: { getVideoTracks: () => [track], getTracks: () => [track] } as unknown as MediaStream };
};
const media = { camera: fakeStream(), screen: fakeStream() };
const proctor = vi.hoisted(() => ({
  requestCamera: vi.fn(),
  requestScreen: vi.fn(),
  loadFaceDetector: vi.fn(),
  enterFullscreen: vi.fn(),
  exitFullscreen: vi.fn(),
  isFullscreen: vi.fn(),
  stop: vi.fn(),
}));
vi.mock("@/lib/exam/proctoring", () => ({ proctoring: proctor, MAX_FACE_WARNINGS: 3 }));

const attempt = (over: Partial<SkillAttempt> = {}): SkillAttempt => ({
  id: "att1",
  examId: "ex1",
  title: "HTML exam",
  attemptNo: 1,
  status: "in_progress",
  startedAt: new Date().toISOString(),
  deadlineAt: new Date(Date.now() + 20 * 60_000).toISOString(),
  sessionKey: "key-1",
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
  title: "HTML exam",
  outcome: "qualified",
  completedAt: new Date().toISOString(),
  feedbackGiven: false,
  ...over,
});

beforeEach(() => {
  nav.reset();
  media.camera = fakeStream();
  media.screen = fakeStream();
  proctor.requestCamera.mockImplementation(async () => media.camera.stream);
  proctor.requestScreen.mockImplementation(async () => media.screen.stream);
  proctor.loadFaceDetector.mockResolvedValue({ check: async () => null });
  proctor.enterFullscreen.mockResolvedValue(undefined);
  proctor.exitFullscreen.mockResolvedValue(undefined);
  proctor.isFullscreen.mockReturnValue(true);
});

describe("formatClock", () => {
  it("shows minutes and seconds, and hours when needed", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(125)).toBe("2:05");
    expect(formatClock(3725)).toBe("1:02:05");
    expect(formatClock(-5)).toBe("0:00");
  });
});

describe("Taking a course or domain exam (proctored, one attempt)", () => {
  const listWith = (over: Partial<SkillExam> = {}) => http.get(`${API}/skill-exams`, () => ok([exam({ id: "ex1", ...over })]));

  /** Accepts the terms, turns on the camera, shares the screen and starts. */
  async function getReady(user: ReturnType<typeof userEvent.setup>) {
    const start = await screen.findByRole("button", { name: "Start exam in fullscreen" });
    expect(start).toBeDisabled();
    await user.click(screen.getByLabelText("I have read and agree to the exam terms and conditions"));
    await user.click(screen.getByRole("button", { name: "Turn on camera" }));
    expect(await screen.findByRole("button", { name: "Camera ready" })).toBeDisabled();
    expect(start).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Share entire screen" }));
    expect(await screen.findByRole("button", { name: "Screen shared" })).toBeDisabled();
    await user.click(start);
  }

  it("shows the terms, needs camera, entire screen and fullscreen, then answers with the session key and shows Qualified", async () => {
    const saved: unknown[] = [];
    server.use(
      listWith(),
      http.post(`${API}/skill-exams/ex1/start`, () => ok(attempt(), 201)),
      http.put(`${API}/skill-exam-attempts/att1/answers/:qid`, async ({ params, request }) => {
        saved.push([params.qid, ((await request.json()) as { selectedOptionId: string }).selectedOptionId, request.headers.get("X-Exam-Session")]);
        return ok({ questionId: String(params.qid), selectedOptionId: "x" });
      }),
      http.post(`${API}/skill-exam-attempts/att1/submit`, ({ request }) => (request.headers.get("X-Exam-Session") === "key-1" ? ok(result()) : fail(409, "EXAM_ENDED"))),
    );
    const user = userEvent.setup();
    render(<SkillExamRunner examId="ex1" />);
    expect(await screen.findByRole("heading", { name: "Exam terms and conditions" })).toBeInTheDocument();
    expect(screen.getByText(/Switching to another tab or app, leaving fullscreen, refreshing or closing the page ends the exam/)).toBeInTheDocument();
    await getReady(user);
    expect(proctor.enterFullscreen).toHaveBeenCalled();

    expect(await screen.findByText("What does HTML stand for?")).toBeInTheDocument();
    await user.click(screen.getByLabelText("HyperText Markup Language"));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(await screen.findByLabelText("<a>"));
    expect(saved).toEqual([["q1", "q1-a", "key-1"], ["q2", "q2-a", "key-1"]]);

    await user.click(screen.getByRole("button", { name: "Submit exam" }));
    expect(await screen.findByRole("heading", { name: "Qualified" })).toBeInTheDocument();
    expect(screen.getByText("Congratulations!")).toBeInTheDocument();
    expect(screen.getByText(/Please visit our branch for further process on your placement offer/)).toBeInTheDocument();
    expect(screen.queryByText(/%|Retake|retake/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("link", { name: /Back to my learning/ })).not.toBeInTheDocument();
    expect(media.camera.track.stopped || proctor.stop.mock.calls.length > 0).toBe(true);
  });

  it("asks before submitting with unanswered questions, then shows Disqualified with Feedback", async () => {
    let feedback: unknown = null;
    server.use(
      listWith(),
      http.post(`${API}/skill-exams/ex1/start`, () => ok(attempt(), 201)),
      http.post(`${API}/skill-exam-attempts/att1/submit`, () => ok(result({ outcome: "disqualified" }))),
      http.post(`${API}/skill-exam-attempts/att1/feedback`, async ({ request }) => {
        feedback = await request.json();
        return ok(result({ outcome: "disqualified", feedbackGiven: true }), 201);
      }),
    );
    const user = userEvent.setup();
    render(<SkillExamRunner examId="ex1" />);
    await getReady(user);
    await screen.findByText("What does HTML stand for?");
    await user.click(screen.getByRole("button", { name: "Go to question 2" }));
    await user.click(screen.getByRole("button", { name: "Submit exam" }));
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Submit with 2 unanswered?");
    await user.click(screen.getByRole("button", { name: "Submit now" }));

    expect(await screen.findByRole("heading", { name: "Disqualified" })).toBeInTheDocument();
    expect(screen.getByText("Don't worry.")).toBeInTheDocument();
    expect(screen.getByText("Contact our support team for further process.")).toBeInTheDocument();
    expect(screen.queryByText(/Attempt 1|Not passed|retake/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Feedback" }));
    await user.click(screen.getByLabelText("4 out of 5"));
    await user.type(screen.getByLabelText(/Comments/), "Good questions");
    await user.click(screen.getByRole("button", { name: "Send feedback" }));
    expect(await screen.findByText("Thank you for your feedback.")).toBeInTheDocument();
    expect(feedback).toEqual({ rating: 4, comments: "Good questions" });
  });

  it("ends the exam when the candidate switches tab, and shows Contact us instead of Continue", async () => {
    let ended: unknown = null;
    server.use(
      listWith(),
      http.post(`${API}/skill-exams/ex1/start`, () => ok(attempt(), 201)),
      http.post(`${API}/skill-exam-attempts/att1/terminate`, async ({ request }) => {
        ended = await request.json();
        return ok(result({ outcome: "terminated" }));
      }),
    );
    const user = userEvent.setup();
    render(<SkillExamRunner examId="ex1" />);
    await getReady(user);
    await screen.findByText("What does HTML stand for?");

    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    visibility.mockRestore();
    expect(await screen.findByRole("heading", { name: "Your exam has ended" })).toBeInTheDocument();
    expect(screen.getByText(/You switched to another tab or app/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Contact us" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Continue/ })).not.toBeInTheDocument();
    await waitFor(() => expect(ended).toEqual({ reason: "tab_hidden" }));
  });

  it("sends a heartbeat with the session key, and shows the end when the server already closed the exam", async () => {
    const beats: (string | null)[] = [];
    let closed = false;
    server.use(
      listWith(),
      http.post(`${API}/skill-exams/ex1/start`, () => ok(attempt(), 201)),
      http.post(`${API}/skill-exam-attempts/att1/heartbeat`, ({ request }) => {
        beats.push(request.headers.get("X-Exam-Session"));
        return closed ? fail(409, "EXAM_ENDED") : ok({ deadlineAt: attempt().deadlineAt });
      }),
      http.post(`${API}/skill-exam-attempts/att1/submit`, () => ok(result({ outcome: "terminated" }))),
    );
    const user = userEvent.setup();
    render(<SkillExamRunner examId="ex1" />);
    await getReady(user);
    await screen.findByText("What does HTML stand for?");

    window.dispatchEvent(new Event("online")); // a heartbeat is also sent as soon as the connection is back
    await waitFor(() => expect(beats).toEqual(["key-1"]));
    expect(screen.getByText("What does HTML stand for?")).toBeInTheDocument();

    closed = true; // e.g. ended after 5 minutes without contact
    window.dispatchEvent(new Event("online"));
    expect(await screen.findByRole("heading", { name: "Your exam has ended" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Contact us" })).toBeInTheDocument();
  });

  it("ends the exam when screen sharing stops", async () => {
    let ended: unknown = null;
    server.use(
      listWith(),
      http.post(`${API}/skill-exams/ex1/start`, () => ok(attempt(), 201)),
      http.post(`${API}/skill-exam-attempts/att1/terminate`, async ({ request }) => {
        ended = await request.json();
        return ok(result({ outcome: "terminated" }));
      }),
    );
    const user = userEvent.setup();
    render(<SkillExamRunner examId="ex1" />);
    await getReady(user);
    await screen.findByText("What does HTML stand for?");
    media.screen.track.dispatchEvent(new Event("ended"));
    expect(await screen.findByText(/Screen sharing was stopped/)).toBeInTheDocument();
    await waitFor(() => expect(ended).toEqual({ reason: "screen_share_stopped" }));
  });

  it("does not continue an exam the candidate comes back to: it is ended", async () => {
    let ended: unknown = null;
    server.use(
      listWith({ state: "in_progress", attemptId: "att1" }),
      http.post(`${API}/skill-exam-attempts/att1/terminate`, async ({ request }) => {
        ended = await request.json();
        return ok(result({ outcome: "terminated" }));
      }),
    );
    render(<SkillExamRunner examId="ex1" />);
    expect(await screen.findByRole("heading", { name: "Your exam has ended" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Contact us" })).toBeInTheDocument();
    expect(ended).toEqual({ reason: "left_exam" });
    expect(proctor.requestCamera).not.toHaveBeenCalled();
  });

  it("shows other exams as taken once the candidate has had their one exam", async () => {
    server.use(listWith({ state: "locked" }));
    render(<SkillExamRunner examId="ex1" />);
    expect(await screen.findByRole("heading", { name: "You have already taken your exam" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Dashboard" })).toBeInTheDocument();
  });

  it("shows the outcome of a finished exam", async () => {
    server.use(listWith({ state: "disqualified", attemptId: "att1" }), http.get(`${API}/skill-exam-attempts/att1`, () => ok({ state: "submitted", result: result({ outcome: "disqualified", feedbackGiven: true }) })));
    render(<SkillExamRunner examId="ex1" />);
    expect(await screen.findByRole("heading", { name: "Disqualified" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Feedback" })).not.toBeInTheDocument();
  });

  it("explains a locked exam when the payment is not approved yet", async () => {
    server.use(listWith({ unlocked: false }));
    render(<SkillExamRunner examId="ex1" />);
    expect(await screen.findByText("The exams unlock after you pay the registration fee.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to payment" })).toHaveAttribute("href", "/payment");
  });
});

const exam = (over: Partial<SkillExam> = {}): SkillExam => ({
  id: "ex1",
  scope: "course",
  courseId: "html",
  trackId: null,
  domain: "",
  targetTitle: "HTML",
  title: "HTML exam",
  description: "",
  durationMinutes: 30,
  questionCount: 10,
  unlocked: true,
  state: "available",
  attemptId: null,
  ...over,
});

const lesson = (id: string) => ({ id, title: `Lesson ${id}`, sectionTitle: "Basics", sectionPosition: 1, position: 1, durationSeconds: 100, completed: false, positionSeconds: 0, preview: true });
const course = (id: string, title: string): LearningCourse => ({ id, title, slug: id, description: "", position: 1, lessonCount: 1, completedCount: 0, durationSeconds: 100, comingSoon: false, lessons: [lesson(`${id}-l`)] });

const track = (id: string, title: string, domain: string, selected = false) => ({
  id,
  title,
  slug: id,
  description: "",
  position: 1,
  domain,
  domainPosition: 1,
  available: true,
  selected,
  courseCount: 2,
  lessonCount: 2,
  completedCount: 0,
  durationSeconds: 200,
  courses: [],
});
const pathExam = (id: string, trackId: string, title: string, domain: string, over: Partial<SkillExam> = {}) =>
  exam({ id, scope: "track", courseId: null, trackId, domain, targetTitle: title, title: `${title} exam`, questionCount: 100, durationMinutes: 120, ...over });

describe("Exams on the learning page: one exam per learning path", () => {
  function serve(exams: SkillExam[], tracks: unknown[]) {
    server.use(
      http.get(`${API}/tracks`, () => ok(tracks)),
      http.get(`${API}/courses`, () => ok([course("html", "HTML"), course("js", "JavaScript")])),
      http.get(`${API}/skill-exams`, () => ok(exams)),
    );
  }

  it("shows only the open path's exam: no other domains and no per-course exam buttons", async () => {
    serve(
      [pathExam("p-mern", "t1", "MERN Stack", "Full Stack Development"), pathExam("p-ds", "t2", "Data Science", "Data Science"), exam({ id: "c-html", courseId: "html" })],
      [track("t1", "MERN Stack", "Full Stack Development", true), track("t2", "Data Science", "Data Science")],
    );
    renderPortal(<Learning hub />, { pathname: "/learning", step: "exam_ready" });
    const card = await screen.findByRole("region", { name: "MERN Stack exam" });
    expect(within(card).getByText(/One exam for this learning path, covering its courses · 100 questions · 120 min/)).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "Take exam for MERN Stack" })).toHaveAttribute("href", "/skill-exam/p-mern");
    expect(screen.queryByRole("region", { name: "Data Science exam" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Take exam for HTML/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/domain exam/)).not.toBeInTheDocument();
  });

  it("shows no exam while the candidate is still choosing a path", async () => {
    serve([pathExam("p-mern", "t1", "MERN Stack", "Full Stack Development")], [track("t1", "MERN Stack", "Full Stack Development")]);
    renderPortal(<Learning hub />, { pathname: "/learning", step: "exam_ready" });
    expect(await screen.findByRole("heading", { name: "Choose your learning path" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /exam$/ })).not.toBeInTheDocument();
  });

  it("keeps the path's exam locked until the payment (the button opens the payment popup)", async () => {
    serve([pathExam("p-mern", "t1", "MERN Stack", "Full Stack Development", { unlocked: false })], [track("t1", "MERN Stack", "Full Stack Development", true)]);
    renderPortal(<Learning hub />, { pathname: "/learning", step: "fee_pending" });
    expect(await screen.findByRole("button", { name: "Unlock the exam for MERN Stack" })).toBeEnabled();
  });
});

describe("Go to exam: choose a learning path, grouped by domain", () => {
  it("lists one exam per path under its domain, ignores course and domain exams, and keeps the registration exam", async () => {
    server.use(
      http.get(`${API}/skill-exams`, () =>
        ok([
          pathExam("p-mern", "t1", "MERN Stack", "Full Stack Development"),
          pathExam("p-mean", "t2", "MEAN Stack", "Full Stack Development", { state: "locked" }),
          pathExam("p-ds", "t3", "Data Science", "Data Science", { state: "locked" }),
          exam({ id: "c-html", courseId: "html", targetTitle: "HTML" }),
          exam({ id: "d-fs", scope: "domain", courseId: null, domain: "Full Stack Development", targetTitle: "Full Stack Development" }),
        ]),
      ),
      http.get(`${API}/exams/current`, () => ok({ attemptId: "att-1", status: "link_issued", examUrl: "https://exam.test/start", completedAt: null })),
    );
    renderPortal(<Exam />, { pathname: "/exam", step: "exam_ready" });

    const chooser = await screen.findByRole("region", { name: "Which domain do you want to take test?" });
    const fullStack = within(chooser).getByRole("group", { name: "Full Stack Development" });
    expect(within(fullStack).getAllByRole("heading", { level: 4 }).map((h) => h.textContent)).toEqual(["MERN Stack", "MEAN Stack"]);
    expect(within(fullStack).getByRole("link", { name: "Take exam for MERN Stack" })).toHaveAttribute("href", "/skill-exam/p-mern");
    expect(within(fullStack).getByRole("button", { name: /Exam for MEAN Stack is locked/ })).toBeDisabled();
    expect(within(chooser).getByRole("group", { name: "Data Science" })).toBeInTheDocument();
    expect(within(chooser).getAllByText(/^100 questions · 120 min$/)).toHaveLength(3);
    expect(screen.queryByRole("link", { name: /HTML/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/pass mark|Or test one course/)).not.toBeInTheDocument();

    const registration = screen.getByRole("region", { name: "Your registration exam" });
    expect(await within(registration).findByRole("link", { name: /Start exam/ })).toHaveAttribute("href", "https://exam.test/start");
  });

  it("locks the exams before payment", async () => {
    server.use(http.get(`${API}/skill-exams`, () => ok([pathExam("p-mern", "t1", "MERN Stack", "Full Stack Development", { unlocked: false })])));
    renderPortal(<Exam />, { pathname: "/exam", step: "exam_ready" });
    expect(await screen.findByRole("button", { name: "Unlock the exam for MERN Stack" })).toBeEnabled();
    expect(screen.getByText(/unlocks after payment/)).toBeInTheDocument();
  });
});

describe("My examinations", () => {
  it("lists the exams the candidate has taken with Qualified or Disqualified and a link to the result", async () => {
    server.use(
      http.get(`${API}/exams/candidate-exams`, () => ok([])),
      http.get(`${API}/skill-exam-attempts`, () =>
        ok([
          { attemptId: "a2", examId: "p-mern", title: "MERN Stack exam", targetTitle: "MERN Stack", state: "qualified", startedAt: "2026-11-19T05:00:00Z", completedAt: "2026-11-19T06:30:00Z" },
          { attemptId: "a1", examId: "p-ds", title: "Data Science exam", targetTitle: "Data Science", state: "disqualified", startedAt: "2026-11-10T05:00:00Z", completedAt: "2026-11-10T06:30:00Z" },
        ]),
      ),
    );
    renderPortal(<ManagedExamList />, { pathname: "/examinations", step: "exam_ready" });
    const taken = await screen.findByRole("region", { name: "Exams you have taken" });
    const items = within(taken).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("MERN Stack exam");
    expect(items[0]).toHaveTextContent("Qualified");
    expect(items[1]).toHaveTextContent("Disqualified");
    expect(within(items[0]!).getByRole("link", { name: "View result of MERN Stack exam" })).toHaveAttribute("href", "/skill-exam/p-mern");
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("explains an empty page and links to the exam", async () => {
    server.use(http.get(`${API}/exams/candidate-exams`, () => ok([])), http.get(`${API}/skill-exam-attempts`, () => ok([])));
    renderPortal(<ManagedExamList />, { pathname: "/examinations", step: "exam_ready" });
    expect(await screen.findByRole("heading", { name: "No examinations yet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to exam" })).toHaveAttribute("href", "/exam");
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
