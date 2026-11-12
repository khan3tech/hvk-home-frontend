"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import type { OnboardingStatus, PaymentConfig } from "@/types/api";
import { portalApi } from "@/lib/api/portal";
import { errorMessage } from "@/lib/api/client";
import { canUseAdminPath, isPrePayment, isStaff, redirectForStep, staffHome } from "@/lib/journey";
import { useSession } from "@/lib/session/session-provider";
import { PaymentPromptProvider } from "./payment-prompt";
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
  // How candidates pay right now. In manual mode a new candidate is sent to the courses, not to a payment page.
  const [payment, setPayment] = React.useState<{ config: PaymentConfig | null; done: boolean }>({ config: null, done: false });

  const reload = React.useCallback(async () => {
    const next = await portalApi.onboardingStatus();
    setJourney({ status: next, path: window.location.pathname });
    return next;
  }, []);

  const staff = isStaff(candidate?.role);
  const wrongArea = session === "authenticated" && (area === "admin" ? !staff : staff);
  // Staff stay on the screens of their own role (the interiors role has only the Interiors screens).
  const staffTarget = area === "admin" && session === "authenticated" && staff && !canUseAdminPath(candidate?.role, pathname) ? staffHome(candidate?.role) : null;

  React.useEffect(() => {
    if (session === "anonymous") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (wrongArea) router.replace(area === "admin" ? "/dashboard" : staffHome(candidate?.role));
    else if (staffTarget) router.replace(staffTarget);
  }, [session, wrongArea, staffTarget, area, pathname, router, candidate?.role]);

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

  React.useEffect(() => {
    if (area !== "candidate" || session !== "authenticated" || staff) return;
    let cancelled = false;
    portalApi
      .paymentConfig()
      .then((config) => !cancelled && setPayment({ config, done: true }))
      .catch(() => !cancelled && setPayment({ config: null, done: true })); // an older API behaves as online payment
    return () => {
      cancelled = true;
    };
  }, [area, session, staff]);

  const fresh = journey && journey.path === pathname ? journey.status : null;
  const manual = payment.config?.mode === "manual";
  const target = area === "candidate" && fresh ? redirectForStep(pathname, fresh.step, manual) : null;
  // Before the fee is paid the right page depends on the payment mode, so wait for it.
  const waitingForMode = area === "candidate" && fresh !== null && isPrePayment(fresh.step) && !payment.done;
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

  const ready = session === "authenticated" && !wrongArea && !staffTarget && (area === "admin" || (value && !target && !waitingForMode));
  if (!ready) return <StatusCard tone="loading" title="Loading your account…" />;
  if (area === "admin") return <>{children}</>;
  return (
    <JourneyContext.Provider value={value}>
      <PaymentPromptProvider config={payment.config} locked={value ? isPrePayment(value.status.step) : false}>
        {children}
      </PaymentPromptProvider>
    </JourneyContext.Provider>
  );
}
