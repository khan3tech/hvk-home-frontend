"use client";

import * as React from "react";
import type { AuthResult, Candidate } from "@/types/api";
import { authApi } from "@/lib/api/auth";
import { ApiError, registerSessionBridge } from "@/lib/api/client";

export type SessionStatus = "loading" | "authenticated" | "anonymous";

interface SessionContextValue {
  status: SessionStatus;
  candidate: Candidate | null;
  /** Store a fresh sign-in (register/login/OTP result). */
  signIn(result: AuthResult): void;
  signOut(): Promise<void>;
  /** Replace the cached candidate (e.g. after a profile update). */
  setCandidate(candidate: Candidate): void;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

/** Non-secret hint read by proxy.ts for optimistic redirects; the API stays the authority. */
export const SIGNED_IN_HINT = "hvk_signed_in";
function setHint(on: boolean): void {
  document.cookie = on
    ? `${SIGNED_IN_HINT}=1; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
    : `${SIGNED_IN_HINT}=; Path=/; SameSite=Lax; Max-Age=0`;
}

const CHANNEL = "hvk-session";

function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  // The callback's promise is awaited by the lock, so this resolves to T at runtime.
  return locks ? (locks.request("hvk-session-refresh", fn) as unknown as Promise<T>) : fn();
}

/**
 * Holds the session in memory only. The refresh token is an httpOnly cookie set by the API, so
 * on load the provider restores the session by calling /auth/refresh.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<SessionStatus>("loading");
  const [candidate, setCandidateState] = React.useState<Candidate | null>(null);
  const tokenRef = React.useRef<string | null>(null);
  const refreshing = React.useRef<Promise<string | null> | null>(null);
  const channel = React.useRef<BroadcastChannel | null>(null);

  const clear = React.useCallback(() => {
    tokenRef.current = null;
    setCandidateState(null);
    setStatus("anonymous");
    setHint(false);
  }, []);

  const apply = React.useCallback((result: AuthResult) => {
    tokenRef.current = result.accessToken;
    setCandidateState(result.candidate);
    setStatus("authenticated");
    setHint(true);
  }, []);

  /**
   * One refresh at a time: concurrent 401s in this tab share one request, and a Web Lock
   * serializes tabs. The API revokes the whole session if a rotated refresh token is reused,
   * so two tabs must never refresh with the same cookie at once.
   */
  const refresh = React.useCallback((): Promise<string | null> => {
    refreshing.current ??= withRefreshLock(() => authApi.refresh())
      .then((result) => {
        apply(result);
        return result.accessToken;
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.code === "NETWORK_ERROR") {
          // Keep the current state; the next request will retry.
          return tokenRef.current;
        }
        clear();
        return null;
      })
      .finally(() => {
        refreshing.current = null;
      });
    return refreshing.current;
  }, [apply, clear]);

  React.useEffect(() => {
    registerSessionBridge({
      getAccessToken: () => tokenRef.current,
      refresh,
      onUnauthenticated: clear,
    });
    return () => registerSessionBridge(null);
  }, [refresh, clear]);

  // Restore the session once on load.
  React.useEffect(() => {
    void refresh().then((token) => {
      if (!token) clear();
    });
  }, [refresh, clear]);

  // Sign-out in one tab signs out the others.
  React.useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = (event: MessageEvent) => {
      if (event.data === "logout") clear();
    };
    channel.current = ch;
    return () => ch.close();
  }, [clear]);

  const value = React.useMemo<SessionContextValue>(
    () => ({
      status,
      candidate,
      signIn: apply,
      signOut: async () => {
        try {
          await authApi.logout();
        } catch {
          // Logging out locally matters most; the server session expires anyway.
        }
        clear();
        channel.current?.postMessage("logout");
      },
      setCandidate: setCandidateState,
    }),
    [status, candidate, apply, clear],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
