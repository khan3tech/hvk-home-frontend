"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import type { OnboardingStatus } from "@/types/api";
import { portalApi } from "@/lib/api/portal";
import { errorMessage } from "@/lib/api/client";
import { isStaff, redirectForStep } from "@/lib/journey";
import { useSession } from "@/lib/session/session-provider";
import { StatusCard } from "./status-card";

interface JourneyContextValue {
  status: OnboardingStatus;
  /** Re-reads the step from the API (after an action that changes it). */
  reload(): Promise<OnboardingStatus>;
}

const JourneyContext = React.createContext<JourneyContextValue | null>(null);

export function useJourney(): JourneyContextValue {
  const ctx = React.useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney must be used inside the candidate portal");
  return ctx;
}

/**
 * Guards a portal area. Anonymous users go to /login; staff and candidates are kept in their
 * own areas; candidates are routed to the page for their current onboarding step.
 */
export function PortalGate({ area, children }: { area: "candidate" | "admin"; children: React.ReactNode }) {
  const { status: session, candidate } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  // The status is tagged with the path it was loaded for: after a client-side navigation the old
  // step must not drive redirects for the new page (that caused a redirect ping-pong).
  const [journey, setJourney] = React.useState<{ status: OnboardingStatus; path: string } | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    const next = await portalApi.onboardingStatus();
    setJourney({ status: next, path: window.location.pathname });
    return next;
  }, []);

  const staff = isStaff(candidate?.role);
  const wrongArea = session === "authenticated" && (area === "admin" ? !staff : staff);

  React.useEffect(() => {
    if (session === "anonymous") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (wrongArea) router.replace(area === "admin" ? "/dashboard" : "/admin");
  }, [session, wrongArea, area, pathname, router]);

  React.useEffect(() => {
    if (area !== "candidate" || session !== "authenticated" || staff) return;
    let cancelled = false;
    portalApi
      .onboardingStatus()
      .then((next) => {
        if (cancelled) return;
        setJourney({ status: next, path: pathname });
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [area, session, staff, pathname]);

  const fresh = journey && journey.path === pathname ? journey.status : null;
  const target = area === "candidate" && fresh ? redirectForStep(pathname, fresh.step) : null;
  React.useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  const value = React.useMemo(() => (fresh ? { status: fresh, reload } : null), [fresh, reload]);

  if (loadError) {
    return (
      <StatusCard tone="error" title="We couldn't load your account">
        <p>{loadError}</p>
        <button
          type="button"
          onClick={() => {
            setLoadError(null);
            void reload().catch((err: unknown) => setLoadError(errorMessage(err)));
          }}
          className="mt-4 font-semibold text-primary-blue underline dark:text-bright-blue"
        >
          Try again
        </button>
      </StatusCard>
    );
  }

  const ready = session === "authenticated" && !wrongArea && (area === "admin" || (value && !target));
  if (!ready) return <StatusCard tone="loading" title="Loading your account…" />;
  if (area === "admin") return <>{children}</>;
  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}
