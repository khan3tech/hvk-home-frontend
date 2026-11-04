import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LearningCourse, LearningLesson, LearningTrack } from "@/types/api";
import { API, ok } from "../msw/handlers";
import { server } from "../msw/server";
import { nav, renderPortal } from "../helpers/portal";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { Learning } = await import("@/components/learning/learning");

const lesson = (id: string, over: Partial<LearningLesson> = {}): LearningLesson => ({
  id,
  title: `Lesson ${id}`,
  sectionTitle: "Basics",
  sectionPosition: 1,
  position: 1,
  durationSeconds: 100,
  completed: false,
  positionSeconds: 0,
  ...over,
});

const course = (slug: string, title: string, lessons: LearningLesson[], comingSoon = false): LearningCourse => ({
  id: slug,
  title,
  slug,
  description: `About ${title}`,
  position: 1,
  lessonCount: lessons.length,
  completedCount: lessons.filter((l) => l.completed).length,
  durationSeconds: lessons.length * 100,
  comingSoon,
  lessons,
});

const track = (slug: string, title: string, courses: LearningCourse[], over: Partial<LearningTrack> = {}): LearningTrack => ({
  id: slug,
  title,
  slug,
  description: `${title} path`,
  position: 1,
  available: courses.some((c) => !c.comingSoon),
  selected: false,
  courseCount: courses.length,
  availableCourseCount: courses.filter((c) => !c.comingSoon).length,
  lessonCount: courses.reduce((n, c) => n + c.lessonCount, 0),
  completedCount: courses.reduce((n, c) => n + c.completedCount, 0),
  durationSeconds: courses.reduce((n, c) => n + c.durationSeconds, 0),
  courses: courses.map((c) => ({ id: c.id, title: c.title, slug: c.slug, comingSoon: c.comingSoon, lessonCount: c.lessonCount, completedCount: c.completedCount, durationSeconds: c.durationSeconds })),
  ...over,
});

const html = (done = false) => course("html", "HTML", [lesson("h1", { completed: done })]);
const js = (done = false) => course("js", "JavaScript", [lesson("j1", { completed: done })]);
const node = () => course("node", "Node.js", [], true);

function serve(opts: { tracks: LearningTrack[]; byTrack: Record<string, LearningCourse[]> }) {
  const calls = { selected: [] as string[], courseQueries: [] as (string | null)[], skip: 0, complete: 0 };
  server.use(
    http.get(`${API}/tracks`, () => ok(opts.tracks)),
    http.get(`${API}/courses`, ({ request }) => {
      const id = new URL(request.url).searchParams.get("track");
      calls.courseQueries.push(id);
      return ok(id ? (opts.byTrack[id] ?? []) : Object.values(opts.byTrack).flat());
    }),
    http.put(`${API}/tracks/:id/select`, ({ params }) => {
      calls.selected.push(String(params.id));
      return ok({ trackId: params.id, selected: true });
    }),
    http.post(`${API}/lessons/:id/play`, ({ params }) => ok({ url: `https://cdn.test/${String(params.id)}.mp4`, expiresAt: "2030-01-01T00:00:00Z" })),
    http.put(`${API}/lessons/:id/progress`, async ({ params }) => ok({ lessonId: params.id, positionSeconds: 1, completed: false })),
    http.post(`${API}/onboarding/demo/skip`, () => {
      calls.skip += 1;
      return ok({ step: "fee_pending", demoAction: "skipped", nextStep: "exam_ready" });
    }),
    http.post(`${API}/onboarding/demo/complete`, () => {
      calls.complete += 1;
      return ok({ step: "fee_pending", demoAction: "completed", nextStep: "exam_ready" });
    }),
  );
  return calls;
}

const frontend = () => track("frontend", "Frontend Developer", [html(), js()]);
const ai = () => track("ai", "AI Engineer", [node()]);
const byTrack = () => ({ frontend: [html(), js()], fullstack: [html(), js(), node()], ai: [node()] });

beforeEach(() => {
  nav.reset();
  window.history.replaceState(null, "", "/onboarding");
});

describe("Learning with tracks", () => {
  it("asks the candidate to choose a track and lists every track", async () => {
    serve({ tracks: [frontend(), fullStack(), ai()], byTrack: byTrack() });
    renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    expect(await screen.findByRole("heading", { name: "Choose your learning path" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["Frontend Developer", "Full Stack Developer", "AI Engineer"]);
    expect(screen.getByRole("button", { name: "Choose Frontend Developer" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Start HTML/ })).toBeNull(); // no flat course list
  });

  it("shows a track without videos as Coming soon and cannot be chosen", async () => {
    const calls = serve({ tracks: [frontend(), ai()], byTrack: byTrack() });
    renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    const soon = await screen.findByRole("button", { name: "AI Engineer is coming soon" });
    expect(soon).toBeDisabled();
    expect(within(screen.getByRole("list", { name: "Courses in AI Engineer" })).getByText(/Node\.js · soon/)).toBeInTheDocument();
    expect(calls.selected).toEqual([]);
  });

  it("choosing a track saves it and shows only that track's courses", async () => {
    const calls = serve({ tracks: [frontend(), fullStack()], byTrack: byTrack() });
    const user = userEvent.setup();
    renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    await user.click(await screen.findByRole("button", { name: "Choose Frontend Developer" }));
    expect(await screen.findByRole("heading", { name: "Frontend Developer" })).toBeInTheDocument();
    expect(calls.selected).toEqual(["frontend"]);
    expect(calls.courseQueries.at(-1)).toBe("frontend");
    expect(screen.getByRole("button", { name: "Start HTML" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Change track" })).toBeInTheDocument();
  });

  it("goes straight to the chosen track on the next visit, and lets the candidate change it", async () => {
    const calls = serve({ tracks: [frontend(), fullStack({ selected: true })], byTrack: byTrack() });
    const user = userEvent.setup();
    renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    expect(await screen.findByRole("heading", { name: "Full Stack Developer" })).toBeInTheDocument();
    expect(calls.courseQueries).toEqual(["fullstack"]);

    await user.click(screen.getByRole("button", { name: "Change track" }));
    expect(await screen.findByRole("heading", { name: "Choose your learning path" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue Full Stack Developer" })).toBeEnabled(); // marked as the current track
    await user.click(screen.getByRole("button", { name: "Back to Full Stack Developer" }));
    expect(await screen.findByRole("button", { name: "Start HTML" })).toBeInTheDocument();
  });

  it("lists a Coming-soon course in the track without a Start button", async () => {
    serve({ tracks: [fullStack({ selected: true })], byTrack: byTrack() });
    renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    const card = (await screen.findByRole("heading", { name: /Node\.js/ })).closest("li")!;
    expect(within(card).getByText("Coming soon", { selector: "span" })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Coming soon Node.js" })).toBeDisabled();
    expect(within(card).queryByRole("progressbar")).toBeNull();
    expect(screen.getByRole("button", { name: "Start HTML" })).toBeEnabled();
  });

  it("continues to payment as completed once the track's videos are watched, ignoring Coming soon courses", async () => {
    const calls = serve({
      tracks: [fullStack({ selected: true })],
      byTrack: { fullstack: [html(true), js(true), node()] },
    });
    const user = userEvent.setup();
    renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    await user.click(await screen.findByRole("button", { name: "Continue to payment" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/payment"));
    expect(calls).toMatchObject({ complete: 1, skip: 0 });
  });

  it("falls back to every course when the tracks request fails (older API)", async () => {
    serve({ tracks: [], byTrack: { all: [html(), js()] } });
    server.use(http.get(`${API}/tracks`, () => new Response("{}", { status: 404 })));
    renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    expect(await screen.findByRole("button", { name: "Start HTML" })).toBeEnabled();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("button", { name: "Change track" })).toBeNull();
  });

  it("shows an error and can still continue when a track cannot be chosen", async () => {
    serve({ tracks: [frontend()], byTrack: byTrack() });
    server.use(http.put(`${API}/tracks/:id/select`, () => new Response(JSON.stringify({ error: { code: "INVALID_STATE", message: "x", details: [] }, meta: { requestId: "r" } }), { status: 422, headers: { "content-type": "application/json" } })));
    const user = userEvent.setup();
    renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    await user.click(await screen.findByRole("button", { name: "Choose Frontend Developer" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip to payment" })).toBeEnabled();
  });
});

function fullStack(over: Partial<LearningTrack> = {}): LearningTrack {
  return { ...track("fullstack", "Full Stack Developer", [html(), js(), node()]), ...over };
}
