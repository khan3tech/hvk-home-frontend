import * as React from "react";
import { render } from "@testing-library/react";
import { http } from "msw";
import type { OnboardingStep, Role } from "@/types/api";
import { SessionProvider } from "@/lib/session/session-provider";
import { PortalGate } from "@/components/portal/portal-gate";
import { API, authResult, ok } from "../msw/handlers";
import { server } from "../msw/server";
import { nav } from "./navigation";

export { nav };

/**
 * Renders a page inside the real session + portal gate with a signed-in user at `step`.
 * `statusCalls` counts GET /onboarding/status requests (journey reloads).
 */
export function renderPortal(
  ui: React.ReactElement,
  opts: { pathname: string; step: OnboardingStep; role?: Role; area?: "candidate" | "admin" },
) {
  nav.pathname = opts.pathname;
  const statusCalls = { count: 0, step: opts.step };
  server.use(
    http.post(`${API}/auth/refresh`, () => ok(authResult({ role: opts.role, step: opts.step }))),
    http.get(`${API}/onboarding/status`, () => {
      statusCalls.count += 1;
      return ok({ step: statusCalls.step, demoAction: null, nextStep: null });
    }),
  );
  const utils = render(
    <SessionProvider>
      <PortalGate area={opts.area ?? "candidate"}>{ui}</PortalGate>
    </SessionProvider>,
  );
  return { ...utils, statusCalls };
}
