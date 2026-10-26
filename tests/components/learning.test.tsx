import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LearningCourse, LearningLesson } from "@/types/api";
import { API, fail, ok } from "../msw/handlers";
import { server } from "../msw/server";
import { nav, renderPortal } from "../helpers/portal";

vi.mock("next/navigation", async () => (await import("../helpers/navigation")).navigationModule);

const { Learning } = await import("@/components/learning/learning");

function lesson(id: string, over: Partial<LearningLesson> = {}): LearningLesson {
  return { id, title: `Lesson ${id}`, sectionTitle: "Basics", sectionPosition: 1, position: 1, durationSeconds: 100, completed: false, positionSeconds: 0, ...over };
}

function course(id: string, title: string, lessons: LearningLesson[]): LearningCourse {
  return {
    id,
    title,
    slug: id,
    description: `About ${title}`,
    position: 1,
    lessonCount: lessons.length,
    completedCount: lessons.filter((l) => l.completed).length,
    durationSeconds: lessons.length * 100,
    lessons,
  };
}

function serve(courses: LearningCourse[]) {
  const calls = { skip: 0, complete: 0, progress: [] as unknown[] };
  server.use(
    http.get(`${API}/courses`, () => ok(courses)),
    http.post(`${API}/lessons/:id/play`, ({ params }) => ok({ url: `https://cdn.test/${String(params.id)}.mp4`, expiresAt: "2030-01-01T00:00:00Z" })),
    http.put(`${API}/lessons/:id/progress`, async ({ params, request }) => {
      const body = (await request.json()) as { positionSeconds: number; completed?: boolean };
      calls.progress.push({ id: params.id, ...body });
      return ok({ lessonId: params.id, positionSeconds: body.positionSeconds, completed: body.completed ?? false });
    }),
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

const two = () => [course("js", "JavaScript", [lesson("a"), lesson("b")]), course("html", "HTML", [lesson("c")])];

beforeEach(() => {
  nav.reset();
  window.history.replaceState(null, "", "/onboarding");
});

describe("Learning (spec 004)", () => {
  it("lists the courses in the order the API returns them, with progress", async () => {
    serve([course("js", "JavaScript", [lesson("a", { completed: true }), lesson("b")]), course("html", "HTML", [lesson("c")])]);
    renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    const headings = await screen.findAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(["JavaScript", "HTML"]);
    expect(screen.getByRole("progressbar", { name: "JavaScript progress" })).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByRole("button", { name: "Resume JavaScript" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Start HTML" })).toBeEnabled();
  });

  it("opens a lesson with a sidebar and jumps to any other lesson", async () => {
    serve(two());
    const user = userEvent.setup();
    const { container } = renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    await user.click(await screen.findByRole("button", { name: "Start JavaScript" }));
    await waitFor(() => expect(container.querySelector("video")).toHaveAttribute("src", "https://cdn.test/a.mp4"));
    const sidebar = screen.getByRole("navigation", { name: "Course content" });
    expect(within(sidebar).getByRole("button", { name: /Lesson a/ })).toHaveAttribute("aria-current", "true");

    await user.click(within(sidebar).getByRole("button", { name: /HTML/ })); // expand another course
    await user.click(within(sidebar).getByRole("button", { name: /Lesson c/ }));
    await waitFor(() => expect(container.querySelector("video")).toHaveAttribute("src", "https://cdn.test/c.mp4"));
    expect(window.location.search).toBe("?lesson=c");
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Skip lesson/ })).toBeDisabled(); // last lesson overall
  });

  it("skips ahead and goes back", async () => {
    serve(two());
    const user = userEvent.setup();
    const { container } = renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    await user.click(await screen.findByRole("button", { name: "Start JavaScript" }));
    await user.click(await screen.findByRole("button", { name: /Skip lesson/ }));
    await waitFor(() => expect(container.querySelector("video")).toHaveAttribute("src", "https://cdn.test/b.mp4"));
    await user.click(screen.getByRole("button", { name: "Previous" }));
    await waitFor(() => expect(container.querySelector("video")).toHaveAttribute("src", "https://cdn.test/a.mp4"));
  });

  it("opens the lesson named in the link", async () => {
    serve(two());
    window.history.replaceState(null, "", "/onboarding?lesson=b");
    const { container } = renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    await waitFor(() => expect(container.querySelector("video")).toHaveAttribute("src", "https://cdn.test/b.mp4"));
  });

  it("resumes at the saved position and marks a finished lesson completed", async () => {
    const calls = serve([course("js", "JavaScript", [lesson("a", { positionSeconds: 40 })])]);
    const user = userEvent.setup();
    const { container } = renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    await user.click(await screen.findByRole("button", { name: "Resume JavaScript" }));
    await waitFor(() => expect(container.querySelector("video")).not.toBeNull());
    const video = container.querySelector("video")!;
    fireEvent.loadedMetadata(video);
    expect(video.currentTime).toBe(40);

    video.currentTime = 100;
    fireEvent.ended(video);
    await waitFor(() => expect(calls.progress).toContainEqual({ id: "a", positionSeconds: 100, completed: true }));
    expect(await screen.findByRole("button", { name: "Continue to payment" })).toBeEnabled();
  });

  it("skipping records a skip and goes to payment", async () => {
    const calls = serve(two());
    const user = userEvent.setup();
    renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    await user.click(await screen.findByRole("button", { name: "Skip to payment" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/payment"));
    expect(calls).toMatchObject({ skip: 1, complete: 0 });
  });

  it("completing every lesson records a completion", async () => {
    const calls = serve([course("js", "JavaScript", [lesson("a", { completed: true })])]);
    const user = userEvent.setup();
    renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    await user.click(await screen.findByRole("button", { name: "Continue to payment" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/payment"));
    expect(calls).toMatchObject({ skip: 0, complete: 1 });
  });

  it("with no courses it just offers to continue", async () => {
    const calls = serve([]);
    const user = userEvent.setup();
    renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    expect(await screen.findByText(/no courses yet/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Skip to payment" }));
    await waitFor(() => expect(calls.skip).toBe(1));
  });

  it("still allows continuing when the courses fail to load", async () => {
    const calls = serve([]);
    server.use(http.get(`${API}/courses`, () => fail(500, "INTERNAL_ERROR")));
    const user = userEvent.setup();
    renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    expect(await screen.findByRole("alert")).toHaveTextContent("You can still continue to payment");
    await user.click(screen.getByRole("button", { name: "Skip to payment" }));
    await waitFor(() => expect(calls.skip).toBe(1));
  });

  it("shows an error and re-enables the button when continuing fails", async () => {
    serve(two());
    server.use(http.post(`${API}/onboarding/demo/skip`, () => fail(500, "INTERNAL_ERROR")));
    const user = userEvent.setup();
    renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    await user.click(await screen.findByRole("button", { name: "Skip to payment" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong on our side");
    expect(screen.getByRole("button", { name: "Skip to payment" })).toBeEnabled();
  });

  it("asks for a fresh link when the video fails, then gives up after a few tries", async () => {
    serve(two());
    let plays = 0;
    server.use(
      http.post(`${API}/lessons/:id/play`, () => {
        plays += 1;
        return ok({ url: `https://cdn.test/a-${plays}.mp4`, expiresAt: "2030-01-01T00:00:00Z" });
      }),
    );
    const user = userEvent.setup();
    const { container } = renderPortal(<Learning />, { pathname: "/onboarding", step: "demo_pending" });
    await user.click(await screen.findByRole("button", { name: "Start JavaScript" }));
    for (let i = 1; i <= 3; i += 1) {
      await waitFor(() => expect(container.querySelector("video")).toHaveAttribute("src", `https://cdn.test/a-${i}.mp4`));
      fireEvent.error(container.querySelector("video")!);
    }
    await waitFor(() => expect(container.querySelector("video")).toHaveAttribute("src", "https://cdn.test/a-4.mp4"));
    fireEvent.error(container.querySelector("video")!);
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be played");
    expect(plays).toBe(4);
  });
});
